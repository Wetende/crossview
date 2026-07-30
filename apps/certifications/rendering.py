"""Safe structured-layout rendering shared by preview and issuance."""

from __future__ import annotations

import base64
import html
import io
import math
import os
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError


PLACEHOLDER_FALLBACKS = {
    "student_name": "Learner",
    "student_number": "",
    "admission_number": "",
    "examination_number": "",
    "program_title": "Completed course",
    "course_details": "",
    "course_level": "",
    "department": "",
    "campus": "",
    "grade": "",
    "score": "",
    "progress": "",
    "course_duration": "",
    "course_start_date": "",
    "completion_date": "",
    "issue_date": "",
    "serial_number": "",
    "verification_code": "",
    "instructor_name": "Course instructor",
    "co_instructor_name": "",
    "principal_name": "",
    "organization_name": "Learning Academy",
    "verification_url": "",
}


def _replace_placeholders(value, data):
    result = str(value or "")
    values = {**PLACEHOLDER_FALLBACKS, **(data or {})}
    for key, replacement in values.items():
        result = result.replace(f"{{{{{key}}}}}", str(replacement or ""))
    return result


def _css_number(value, default=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _local_asset_uri(value):
    """Allow only files under MEDIA_ROOT; reject remote and traversal URLs."""
    if not value:
        return None
    raw = str(value).strip()
    media_url = str(settings.MEDIA_URL or "/media/")
    if raw.startswith(media_url):
        relative = raw[len(media_url) :]
    elif raw.startswith("certificates/assets/"):
        relative = raw
    else:
        raise ValidationError("Certificate assets must be uploaded to this platform.")

    media_root = Path(settings.MEDIA_ROOT).resolve()
    candidate = (media_root / relative).resolve()
    try:
        candidate.relative_to(media_root)
    except ValueError as exc:
        raise ValidationError("Certificate asset path is invalid.") from exc
    if not candidate.is_file():
        raise ValidationError("Certificate asset is missing.")
    return candidate.as_uri()


def _qr_data_uri(value, styles=None):
    import qrcode

    styles = styles or {}
    correction_levels = {
        "L": qrcode.constants.ERROR_CORRECT_L,
        "M": qrcode.constants.ERROR_CORRECT_M,
        "Q": qrcode.constants.ERROR_CORRECT_Q,
        "H": qrcode.constants.ERROR_CORRECT_H,
    }
    qr = qrcode.QRCode(
        version=None,
        error_correction=correction_levels.get(
            str(styles.get("errorCorrection") or "M").upper(),
            qrcode.constants.ERROR_CORRECT_M,
        ),
        box_size=10,
        border=0,
    )
    qr.add_data(str(value or "certificate verification"))
    qr.make(fit=True)
    image = qr.make_image(
        fill_color=str(styles.get("foreground") or "#172033"),
        back_color=str(styles.get("background") or "#ffffff"),
    )
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def _transform_text(value, transform):
    text = str(value or "")
    if transform == "uppercase":
        return text.upper()
    if transform == "lowercase":
        return text.lower()
    if transform == "capitalize":
        return " ".join(word[:1].upper() + word[1:] for word in text.split(" "))
    return text


def _character_width_units(character):
    if character.isspace():
        return 0.35
    if character in "ilI1.,'’`|!:;":
        return 0.28
    if character in "MW@#%&":
        return 0.9
    if character.isascii() and (character.isupper() or character.isdigit()):
        return 0.67
    if ord(character) > 0xFF:
        return 1
    return 0.55


def _estimated_line_width(value, font_size, letter_spacing):
    characters = list(str(value or ""))
    return (
        sum(_character_width_units(character) for character in characters)
        * font_size
        + max(0, len(characters) - 1) * letter_spacing
    )


def _estimate_text_at_size(
    *,
    text,
    font_size,
    width_pixels,
    height_pixels,
    line_height,
    letter_spacing,
    single_line,
):
    source_lines = str(text or "").split("\n")
    estimated_lines = 0
    widest_line = 0
    for line in source_lines:
        line_width = _estimated_line_width(line, font_size, letter_spacing)
        widest_line = max(widest_line, line_width)
        estimated_lines += (
            1
            if single_line
            else max(1, math.ceil(line_width / max(1, width_pixels)))
        )
    available_lines = max(
        1,
        math.floor(height_pixels / max(1, font_size * line_height)),
    )
    return {
        "estimated_lines": estimated_lines,
        "available_lines": available_lines,
        "overflows": (
            (single_line and widest_line > width_pixels)
            or estimated_lines > available_lines
        ),
    }


def fit_text_font_size(*, text, element, page_width_mm, page_height_mm):
    """Deterministically fit text for both preview and issued PDF rendering."""
    styles = element.get("styles") or {}
    requested_size = _css_number(styles.get("fontSize"), 16)
    maximum_size = max(
        6,
        _css_number(styles.get("maxFontSize"), requested_size),
    )
    font_size = min(requested_size, maximum_size)
    minimum_size = min(
        font_size,
        max(
            6,
            _css_number(
                styles.get("minFontSize"),
                min(12, font_size),
            ),
        ),
    )
    auto_shrink = bool(
        styles.get("autoShrink", element.get("type") == "dynamic_text")
    )
    line_height = _css_number(styles.get("lineHeight"), 1.2)
    letter_spacing = _css_number(styles.get("letterSpacing"), 0)
    single_line = bool(styles.get("singleLine", False))
    reference_width = 960 if float(page_width_mm) >= float(page_height_mm) else 620
    pixels_per_mm = reference_width / max(1, float(page_width_mm))
    width_pixels = max(1, _css_number(element.get("width"), 1) * pixels_per_mm)
    height_pixels = max(1, _css_number(element.get("height"), 1) * pixels_per_mm)
    transformed_text = _transform_text(text, styles.get("textTransform"))
    estimate = _estimate_text_at_size(
        text=transformed_text,
        font_size=font_size,
        width_pixels=width_pixels,
        height_pixels=height_pixels,
        line_height=line_height,
        letter_spacing=letter_spacing,
        single_line=single_line,
    )

    while auto_shrink and estimate["overflows"] and font_size > minimum_size:
        font_size = max(minimum_size, font_size - 0.5)
        estimate = _estimate_text_at_size(
            text=transformed_text,
            font_size=font_size,
            width_pixels=width_pixels,
            height_pixels=height_pixels,
            line_height=line_height,
            letter_spacing=letter_spacing,
            single_line=single_line,
        )

    return {
        **estimate,
        "font_size": round(font_size, 2),
        "minimum_size": minimum_size,
        "auto_shrink": auto_shrink,
    }


def _element_html(element, data, *, page_width_mm, page_height_mm):
    if element.get("hidden"):
        return ""
    styles = element.get("styles") or {}
    element_type = element.get("type")
    position = (
        f"left:{_css_number(element.get('x'))}mm;"
        f"top:{_css_number(element.get('y'))}mm;"
        f"width:{_css_number(element.get('width'), 1)}mm;"
        f"height:{_css_number(element.get('height'), 1)}mm;"
        f"transform:rotate({_css_number(element.get('rotation'))}deg);"
        f"z-index:{int(_css_number(element.get('zIndex'), 1))};"
    )
    common = f"position:absolute;box-sizing:border-box;{position}"

    if element_type == "shape":
        fill = html.escape(str(styles.get("fill") or "transparent"))
        stroke = html.escape(str(styles.get("stroke") or "transparent"))
        stroke_width = _css_number(styles.get("strokeWidth"), 0)
        radius = (
            "50%"
            if element.get("shape") == "circle"
            else f"{_css_number(styles.get('borderRadius'), 0)}px"
        )
        opacity = _css_number(styles.get("opacity"), 1)
        return (
            f'<div style="{common}background:{fill};border:{stroke_width}px '
            f'solid {stroke};border-radius:{radius};opacity:{opacity};"></div>'
        )

    if element_type == "line":
        stroke = html.escape(str(styles.get("stroke") or "#172033"))
        stroke_width = _css_number(styles.get("strokeWidth"), 1)
        opacity = _css_number(styles.get("opacity"), 1)
        return (
            f'<div style="{common}display:flex;align-items:center;opacity:{opacity};">'
            f'<div style="width:100%;border-top:{stroke_width}px solid {stroke};"></div>'
            "</div>"
        )

    if element_type in {"image", "signature"}:
        source = _local_asset_uri(element.get("assetUrl") or element.get("content"))
        if not source:
            return ""
        object_fit = str(styles.get("objectFit") or "contain")
        if object_fit not in {"contain", "cover"}:
            object_fit = "contain"
        opacity = _css_number(styles.get("opacity"), 1)
        border_color = html.escape(
            str(styles.get("borderColor") or "transparent")
        )
        border_width = _css_number(styles.get("borderWidth"), 0)
        border_radius = _css_number(styles.get("borderRadius"), 0)
        return (
            f'<div style="{common}opacity:{opacity};border:{border_width}px solid '
            f'{border_color};border-radius:{border_radius}px;overflow:hidden;">'
            f'<img src="{html.escape(source)}" '
            f'style="width:100%;height:100%;object-fit:{object_fit};" /></div>'
        )

    if element_type == "qr_code":
        source = _qr_data_uri(data.get("verification_url"), styles)
        background = html.escape(str(styles.get("background") or "#ffffff"))
        border_color = html.escape(
            str(styles.get("borderColor") or "transparent")
        )
        border_width = _css_number(styles.get("borderWidth"), 0)
        padding = _css_number(styles.get("padding"), 1.5)
        return (
            f'<div style="{common}background:{background};padding:{padding}mm;'
            f'border:{border_width}px solid {border_color};">'
            f'<img src="{source}" style="width:100%;height:100%;object-fit:contain;" />'
            "</div>"
        )

    replaced_content = _replace_placeholders(element.get("content"), data)
    content = html.escape(replaced_content)
    font = html.escape(str(styles.get("fontFamily") or "sans-serif"))
    color = html.escape(str(styles.get("color") or "#172033"))
    align = str(styles.get("textAlign") or "center")
    if align not in {"left", "center", "right", "justify"}:
        align = "center"
    weight = max(
        100,
        min(
            900,
            int(round(_css_number(styles.get("fontWeight"), 400) / 100) * 100),
        ),
    )
    fit = fit_text_font_size(
        text=replaced_content,
        element=element,
        page_width_mm=page_width_mm,
        page_height_mm=page_height_mm,
    )
    size = fit["font_size"]
    line_height = _css_number(styles.get("lineHeight"), 1.2)
    letter_spacing = _css_number(styles.get("letterSpacing"), 0)
    opacity = _css_number(styles.get("opacity"), 1)
    vertical = str(styles.get("verticalAlign") or "center")
    vertical_css = {"top": "flex-start", "bottom": "flex-end"}.get(
        vertical, "center"
    )
    font_style = (
        str(styles.get("fontStyle"))
        if styles.get("fontStyle") in {"normal", "italic"}
        else "normal"
    )
    decoration = (
        str(styles.get("textDecoration"))
        if styles.get("textDecoration") in {"none", "underline"}
        else "none"
    )
    transform = (
        str(styles.get("textTransform"))
        if styles.get("textTransform")
        in {"none", "uppercase", "lowercase", "capitalize"}
        else "none"
    )
    single_line = bool(styles.get("singleLine", False))
    text_overflow = (
        str(styles.get("textOverflow"))
        if styles.get("textOverflow") in {"clip", "ellipsis"}
        else "ellipsis"
    )
    wrapping_css = (
        f"white-space:nowrap;text-overflow:{text_overflow};"
        if single_line
        else "overflow-wrap:anywhere;white-space:pre-wrap;"
    )
    shadow_css = ""
    if styles.get("textShadow"):
        shadow_css = (
            "text-shadow:"
            f"{_css_number(styles.get('shadowOffsetX'), 1)}px "
            f"{_css_number(styles.get('shadowOffsetY'), 1)}px "
            f"{_css_number(styles.get('shadowBlur'), 2)}px "
            f"{html.escape(str(styles.get('shadowColor') or '#000000'))};"
        )
    return (
        f'<div style="{common}display:flex;align-items:{vertical_css};'
        f'font-family:{font};font-size:{size}px;font-weight:{weight};color:{color};'
        f'text-align:{align};line-height:{line_height};letter-spacing:{letter_spacing}px;'
        f'font-style:{font_style};text-decoration:{decoration};'
        f'text-transform:{transform};opacity:{opacity};{shadow_css}'
        'overflow:hidden;">'
        f'<div style="width:100%;overflow:hidden;{wrapping_css}">{content}</div></div>'
    )


def layout_to_html(*, layout, width_mm, height_mm, data):
    background = layout.get("background") or {}
    background_color = html.escape(str(background.get("color") or "#ffffff"))
    background_image = _local_asset_uri(background.get("image"))
    background_css = (
        f"background-image:url('{background_image}');"
        "background-size:cover;background-position:center;"
        if background_image
        else ""
    )
    elements = sorted(
        layout.get("elements") or [],
        key=lambda item: int(_css_number(item.get("zIndex"), 1)),
    )
    body = "".join(
        _element_html(
            element,
            data,
            page_width_mm=width_mm,
            page_height_mm=height_mm,
        )
        for element in elements
    )
    return f"""<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
@page {{ size: {float(width_mm)}mm {float(height_mm)}mm; margin: 0; }}
html, body {{ margin: 0; width: {float(width_mm)}mm; height: {float(height_mm)}mm; }}
body {{ font-family: sans-serif; }}
.certificate-page {{
  position: relative;
  width: {float(width_mm)}mm;
  height: {float(height_mm)}mm;
  overflow: hidden;
  box-sizing: border-box;
  background-color: {background_color};
  {background_css}
}}
</style>
</head>
<body><main class="certificate-page">{body}</main></body>
</html>"""


def render_layout_pdf(*, layout, width_mm, height_mm, data, target):
    from weasyprint import HTML

    document = layout_to_html(
        layout=layout,
        width_mm=width_mm,
        height_mm=height_mm,
        data=data,
    )
    target_path = Path(target)
    os.makedirs(target_path.parent, exist_ok=True)
    HTML(string=document, base_url=Path(settings.MEDIA_ROOT).resolve()).write_pdf(
        target_path
    )
    return str(target_path)
