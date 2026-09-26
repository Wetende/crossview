// Measured height of the mobile enrol bar (0px on md and up, where it is
// hidden). The page reads it to keep its last content, the snackbar and
// keyboard focus clear of the bar.
export const ENROLL_BAR_HEIGHT_VAR = "--course-enroll-bar-height";

export const enrollBarHeight = (extra = "0px") =>
    `calc(var(${ENROLL_BAR_HEIGHT_VAR}, 0px) + ${extra})`;
