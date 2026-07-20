from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import OperationalError
from django.db.models import Count, Q
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods, require_POST
from urllib.parse import quote_plus
from inertia import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.utils import get_post_data

from .models import Conversation
from .services import MessagingService

User = get_user_model()


def _serialize_user(user_obj):
    return {
        'id': user_obj.id,
        'name': user_obj.get_full_name() or user_obj.email,
        'email': user_obj.email,
    }


def _serialize_message(message, request_user):
    return {
        'id': message.id,
        'content': message.content,
        'isRead': message.is_read,
        'readAt': message.read_at.isoformat() if message.read_at else None,
        'createdAt': message.created_at.isoformat(),
        'sender': {
            **_serialize_user(message.sender),
            'isMe': message.sender_id == request_user.id,
        },
    }


@login_required
def inbox(request):
    conversations = (
        Conversation.objects.filter(
            Q(participant_one=request.user) | Q(participant_two=request.user)
        )
        .select_related('participant_one', 'participant_two')
        .annotate(
            unread_count=Count(
                'messages',
                filter=Q(messages__is_read=False) & ~Q(messages__sender=request.user),
            )
        )
        .order_by('-last_message_at', '-updated_at')
    )

    conversations_data = []
    for conversation in conversations:
        other_user = conversation.other_participant(request.user)
        last_message = conversation.messages.select_related('sender').order_by(
            '-created_at'
        ).first()
        conversations_data.append(
            {
                'id': conversation.id,
                'otherUser': _serialize_user(other_user),
                'unreadCount': int(conversation.unread_count or 0),
                'lastMessageAt': (
                    conversation.last_message_at.isoformat()
                    if conversation.last_message_at
                    else None
                ),
                'lastMessage': (
                    {
                        'content': last_message.content,
                        'createdAt': last_message.created_at.isoformat(),
                        'senderId': last_message.sender_id,
                    }
                    if last_message
                    else None
                ),
            }
        )

    return render(
        request,
        'Messages/Inbox',
        {
            'conversations': conversations_data,
            'unreadCount': MessagingService.get_unread_count(request.user),
        },
    )


@login_required
def conversation_detail(request, conversation_id: int):
    try:
        conversation = MessagingService.get_user_conversation_or_404(
            conversation_id,
            request.user,
        )
    except Conversation.DoesNotExist:
        messages.error(request, 'Conversation not found.')
        return redirect('/messages/')

    MessagingService.mark_conversation_read(conversation, request.user)

    message_rows = list(
        conversation.messages.select_related('sender').order_by('created_at')
    )

    return render(
        request,
        'Messages/Conversation',
        {
            'conversation': {
                'id': conversation.id,
                'otherUser': _serialize_user(conversation.other_participant(request.user)),
            },
            'messages': [_serialize_message(row, request.user) for row in message_rows],
            'errorMessage': request.GET.get('error') or None,
        },
    )


@login_required
@require_http_methods(['GET', 'POST'])
def new_conversation(request):
    query = request.GET.get('q', '')
    recipient_id = request.GET.get('recipient_id')
    recipient_email = (request.GET.get('recipient_email') or '').strip()
    form_errors = {}
    submitted_content = ''

    preselected_recipient_id = None
    recipient = None
    if recipient_id:
        try:
            recipient = User.objects.get(id=int(recipient_id), is_active=True)
        except (TypeError, ValueError, User.DoesNotExist):
            recipient = None
    if recipient is None and recipient_email:
        recipient = User.objects.filter(
            email__iexact=recipient_email,
            is_active=True,
        ).first()
    if recipient and MessagingService.can_initiate_conversation(
        request.user,
        recipient,
    ):
        preselected_recipient_id = recipient.id
        try:
            participant_one, participant_two = MessagingService.normalize_participants(
                request.user,
                recipient,
            )
            existing_conversation = Conversation.objects.filter(
                participant_one=participant_one,
                participant_two=participant_two,
            ).first()
            if existing_conversation and request.method == 'GET':
                return redirect(f'/messages/{existing_conversation.id}/')
        except (TypeError, ValueError, User.DoesNotExist):
            preselected_recipient_id = None

    if request.method == 'POST':
        data = get_post_data(request)
        content = (data.get('content') or '').strip()
        submitted_content = content

        try:
            target_id = int(data.get('recipient_id') or 0)
        except (TypeError, ValueError):
            target_id = 0

        if not target_id:
            form_errors['recipient_id'] = 'Please select a recipient.'
        elif not content:
            form_errors['content'] = 'Please enter a message.'
        else:
            try:
                recipient = User.objects.get(id=target_id, is_active=True)
                if not MessagingService.can_initiate_conversation(
                    request.user,
                    recipient,
                ):
                    raise PermissionDenied('You cannot message this user.')

                conversation, _ = MessagingService.get_or_create_conversation(
                    request.user,
                    recipient,
                )
                MessagingService.send_message(conversation, request.user, content)
                return redirect(f'/messages/{conversation.id}/')
            except User.DoesNotExist:
                form_errors['_global'] = 'Recipient does not exist.'
            except (PermissionDenied, ValidationError) as exc:
                form_errors['_global'] = str(exc)
            except OperationalError as exc:
                if 'database is locked' in str(exc).lower():
                    form_errors['_global'] = (
                        'Messaging is temporarily busy. Please try sending again.'
                    )
                else:
                    raise

        preselected_recipient_id = target_id or preselected_recipient_id

    recipients = MessagingService.get_allowed_recipients(request.user, query=query)
    recipients_data = [_serialize_user(user_obj) for user_obj in recipients[:100]]

    return render(
        request,
        'Messages/NewConversation',
        {
            'recipients': recipients_data,
            'preselectedRecipientId': preselected_recipient_id,
            'submittedContent': submitted_content,
            'formErrors': form_errors,
            'query': query,
        },
    )


@login_required
@require_POST
def send_message(request, conversation_id: int):
    data = get_post_data(request)
    content = (data.get('content') or '').strip()

    try:
        conversation = MessagingService.get_user_conversation_or_404(
            conversation_id,
            request.user,
        )
    except Conversation.DoesNotExist:
        messages.error(request, 'Conversation not found.')
        return redirect('/messages/')

    if not content:
        return redirect(f'/messages/{conversation.id}/?error={quote_plus("Message cannot be empty.")}')

    error_text = None
    try:
        MessagingService.send_message(conversation, request.user, content)
    except (PermissionDenied, ValidationError) as exc:
        error_text = str(exc)
    except OperationalError as exc:
        if 'database is locked' in str(exc).lower():
            error_text = 'Messaging is temporarily busy. Please try sending again.'
        else:
            raise

    if error_text:
        return redirect(f'/messages/{conversation.id}/?error={quote_plus(error_text)}')

    return redirect(f'/messages/{conversation.id}/')


@login_required
@require_POST
def mark_conversation_read(request, conversation_id: int):
    try:
        conversation = MessagingService.get_user_conversation_or_404(
            conversation_id,
            request.user,
        )
    except Conversation.DoesNotExist:
        messages.error(request, 'Conversation not found.')
        return redirect('/messages/')

    MessagingService.mark_conversation_read(conversation, request.user)

    referer = request.META.get('HTTP_REFERER')
    if referer:
        return redirect(referer)
    return redirect(f'/messages/{conversation.id}/')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_unread_count(request):
    return Response({'count': MessagingService.get_unread_count(request.user)})
