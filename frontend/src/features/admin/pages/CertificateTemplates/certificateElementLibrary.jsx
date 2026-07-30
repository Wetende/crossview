import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DrawOutlinedIcon from "@mui/icons-material/DrawOutlined";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ShapeLineIcon from "@mui/icons-material/ShapeLine";
import TextFieldsIcon from "@mui/icons-material/TextFields";

export const PRIMARY_ELEMENT_GROUPS = [
    "Certificate",
    "Course",
    "Student",
    "Instructor",
];

export const ADDITIONAL_ELEMENT_GROUPS = [
    "Design",
    "Organisation",
    "Verification",
    "Student metadata",
    "Instructor metadata",
    "Course metadata",
];

export const ELEMENT_LIBRARY = [
    {
        group: "Certificate",
        type: "text",
        label: "Text",
        icon: TextFieldsIcon,
        content: "Your text",
    },
    {
        group: "Certificate",
        type: "image",
        label: "Image",
        icon: ImageOutlinedIcon,
        content: "",
    },
    {
        group: "Certificate",
        type: "shape",
        label: "Shape",
        icon: ShapeLineIcon,
        content: "",
    },
    {
        group: "Certificate",
        type: "dynamic_text",
        label: "Certificate code",
        icon: FingerprintIcon,
        content: "{{serial_number}}",
    },
    {
        group: "Certificate",
        type: "qr_code",
        label: "QR-Code",
        icon: QrCode2Icon,
        content: "",
    },
    {
        group: "Certificate",
        type: "dynamic_text",
        label: "Current date",
        icon: CalendarMonthIcon,
        content: "{{issue_date}}",
    },
    {
        group: "Design",
        type: "signature",
        label: "Signature",
        icon: DrawOutlinedIcon,
        content: "",
    },
    {
        group: "Design",
        type: "image",
        label: "Official seal",
        icon: BadgeOutlinedIcon,
        content: "",
    },
    {
        group: "Design",
        type: "image",
        label: "Decorative pattern",
        icon: ImageOutlinedIcon,
        content: "",
    },
    {
        group: "Design",
        type: "line",
        label: "Line",
        icon: HorizontalRuleIcon,
        content: "",
    },
    {
        group: "Design",
        type: "shape",
        label: "Page border",
        icon: ShapeLineIcon,
        content: "",
        variant: "page-border",
        styles: {
            fill: "transparent",
            stroke: "#3157d5",
            strokeWidth: 2,
        },
    },
    {
        group: "Design",
        type: "text",
        label: "Watermark",
        icon: TextFieldsIcon,
        content: "CERTIFIED",
        variant: "watermark",
        styles: {
            fontSize: 52,
            fontWeight: 700,
            color: "#3157d5",
            opacity: 0.12,
        },
    },
    {
        group: "Student",
        type: "dynamic_text",
        label: "Student name",
        icon: PersonOutlineIcon,
        content: "{{student_name}}",
    },
    {
        group: "Student",
        type: "dynamic_text",
        label: "Student code",
        icon: FingerprintIcon,
        content: "{{student_number}}",
    },
    {
        group: "Student metadata",
        type: "dynamic_text",
        label: "Admission number",
        icon: FingerprintIcon,
        content: "{{admission_number}}",
    },
    {
        group: "Student metadata",
        type: "dynamic_text",
        label: "Examination number",
        icon: FingerprintIcon,
        content: "{{examination_number}}",
    },
    {
        group: "Course",
        type: "dynamic_text",
        label: "Course name",
        icon: SchoolOutlinedIcon,
        content: "{{program_title}}",
    },
    {
        group: "Course",
        type: "dynamic_text",
        label: "Details",
        icon: FormatListBulletedIcon,
        content: "{{course_details}}",
        styles: {
            fontSize: 16,
            minFontSize: 9,
            maxFontSize: 16,
            fontWeight: 500,
        },
    },
    {
        group: "Course metadata",
        type: "dynamic_text",
        label: "Course level",
        icon: SchoolOutlinedIcon,
        content: "{{course_level}}",
    },
    {
        group: "Course metadata",
        type: "dynamic_text",
        label: "Department",
        icon: BusinessOutlinedIcon,
        content: "{{department}}",
    },
    {
        group: "Course metadata",
        type: "dynamic_text",
        label: "Grade",
        icon: BadgeOutlinedIcon,
        content: "{{grade}}",
    },
    {
        group: "Course metadata",
        type: "dynamic_text",
        label: "Score",
        icon: BadgeOutlinedIcon,
        content: "{{score}}",
    },
    {
        group: "Course",
        type: "dynamic_text",
        label: "Progress",
        icon: BadgeOutlinedIcon,
        content: "{{progress}}",
    },
    {
        group: "Course",
        type: "dynamic_text",
        label: "Course duration",
        icon: CalendarMonthIcon,
        content: "{{course_duration}}",
    },
    {
        group: "Course",
        type: "dynamic_text",
        label: "Start date",
        icon: CalendarMonthIcon,
        content: "{{course_start_date}}",
    },
    {
        group: "Course",
        type: "dynamic_text",
        label: "End date",
        icon: CalendarMonthIcon,
        content: "{{completion_date}}",
    },
    {
        group: "Verification",
        type: "dynamic_text",
        label: "Verification code",
        icon: FingerprintIcon,
        content: "{{verification_code}}",
    },
    {
        group: "Verification",
        type: "dynamic_text",
        label: "Verification URL",
        icon: QrCode2Icon,
        content: "{{verification_url}}",
    },
    {
        group: "Instructor",
        type: "dynamic_text",
        label: "Instructor name",
        icon: BadgeOutlinedIcon,
        content: "{{instructor_name}}",
    },
    {
        group: "Instructor",
        type: "dynamic_text",
        label: "Co-instructor name",
        icon: GroupsOutlinedIcon,
        content: "{{co_instructor_name}}",
    },
    {
        group: "Instructor metadata",
        type: "dynamic_text",
        label: "Principal / director",
        icon: BadgeOutlinedIcon,
        content: "{{principal_name}}",
    },
    {
        group: "Organisation",
        type: "dynamic_text",
        label: "Organisation",
        icon: BusinessOutlinedIcon,
        content: "{{organization_name}}",
    },
    {
        group: "Organisation",
        type: "dynamic_text",
        label: "Campus",
        icon: BusinessOutlinedIcon,
        content: "{{campus}}",
    },
];
