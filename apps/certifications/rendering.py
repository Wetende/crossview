"""Safe structured-layout rendering shared by preview and issuance."""

from __future__ import annotations

import base64
import html
import io
import os
from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError


PLACEHOLDER_FALLBACKS = {
    "student_name": "Learner",
    "program_title": "Completed course",
    "completion_date": "",
    "issue_date": "",
    "serial_number": "",
    "instructor_name": "Course instructor",
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


def _qr_data_uri(value):
    import qrcode

    image = qrcode.make(str(value or "certificate verification"))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def _element_html(element, data):
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
        radius = "50%" if element.get("shape") == "circle" else "0"
        return (
            f'<div style="{common}background:{fill};border:{stroke_width}px '
            f'solid {stroke};border-radius:{radius};"></div>'
        )

    if element_type == "line":
        stroke = html.escape(str(styles.get("stroke") or "#172033"))
        stroke_width = _css_number(styles.get("strokeWidth"), 1)
        return (
            f'<div style="{common}display:flex;align-items:center;">'
            f'<div style="width:100%;border-top:{stroke_width}px solid {stroke};"></div>'
            "</div>"
        )

    if element_type in {"image", "signature"}:
        source = _local_asset_uri(element.get("assetUrl") or element.get("content"))
        if not source:
            return ""
        return (
            f'<div style="{common}"><img src="{html.escape(source)}" '
            'style="width:100%;height:100%;object-fit:contain;" /></div>'
        )

    if element_type == "qr_code":
        source = _qr_data_uri(data.get("verification_url"))
        return (
            f'<div style="{common}background:white;padding:1.5mm;">'
            f'<img src="{source}" style="width:100%;height:100%;object-fit:contain;" />'
            "</div>"
        )

    content = html.escape(_replace_placeholders(element.get("content"), data))
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
    size = _css_number(styles.get("fontSize"), 16)
    line_height = _css_number(styles.get("lineHeight"), 1.2)
    letter_spacing = _css_number(styles.get("letterSpacing"), 0)
    vertical = str(styles.get("verticalAlign") or "center")
    vertical_css = {"top": "flex-start", "bottom": "flex-end"}.get(
        vertical, "center"
    )
    return (
        f'<div style="{common}display:flex;align-items:{vertical_css};'
        f'font-family:{font};font-size:{size}px;font-weight:{weight};color:{color};'
        f'text-align:{align};line-height:{line_height};letter-spacing:{letter_spacing}px;'
        'overflow:hidden;overflow-wrap:anywhere;white-space:pre-wrap;">'
        f'<div style="width:100%;">{content}</div></div>'
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
    body = "".join(_element_html(element, data) for element in elements)
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
