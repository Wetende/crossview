from django import forms

from apps.core.models import Program

from .models import Inquiry


class InquirySubmissionForm(forms.Form):
    name = forms.CharField(max_length=255, strip=True)
    email = forms.EmailField(max_length=254)
    phone = forms.CharField(max_length=50, required=False, strip=True)
    subject = forms.CharField(max_length=255, required=False, strip=True)
    message = forms.CharField(max_length=5000, required=False, strip=True)
    kind = forms.ChoiceField(choices=Inquiry.Kind.choices)
    source = forms.RegexField(
        regex=r"^[a-z0-9][a-z0-9_-]*$",
        max_length=80,
        error_messages={
            "invalid": "Use lowercase letters, numbers, hyphens, or underscores."
        },
    )
    program_id = forms.IntegerField(required=False, min_value=1)

    def clean(self):
        cleaned = super().clean()
        program_id = cleaned.get("program_id")
        program = None

        if program_id:
            program = Program.objects.filter(
                pk=program_id,
                is_published=True,
            ).first()
            if program is None:
                self.add_error("program_id", "Select an available program.")

        if cleaned.get("kind") == Inquiry.Kind.PROGRAM and program is None:
            self.add_error("program_id", "A program is required for this inquiry type.")

        if not cleaned.get("message") and program is None:
            self.add_error("message", "Enter a message or select a program.")

        cleaned["program"] = program
        return cleaned
