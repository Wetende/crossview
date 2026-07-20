import { useState } from "react";
import {
    Divider,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
} from "@mui/material";
import {
    ChatBubbleOutline as MessageIcon,
    MoreVert as MoreIcon,
    NotificationsNone as ReminderIcon,
    PersonOffOutlined as WithdrawIcon,
    Restore as RestoreIcon,
    VisibilityOutlined as ViewIcon,
    VoiceOverOffOutlined as SuspendIcon,
} from "@mui/icons-material";

import { ACTION_LABELS, getLearnerActions } from "./learnerActions";

const icons = {
    view: <ViewIcon fontSize="small" />,
    message: <MessageIcon fontSize="small" />,
    reminder: <ReminderIcon fontSize="small" />,
    suspend: <SuspendIcon fontSize="small" />,
    withdraw: <WithdrawIcon fontSize="small" />,
    restore: <RestoreIcon fontSize="small" />,
};

export default function LearnerActionsMenu({
    learner,
    onAction,
    remindersEnabled,
}) {
    const [anchor, setAnchor] = useState(null);
    const actions = getLearnerActions(learner, { remindersEnabled });

    const choose = (action) => {
        setAnchor(null);
        onAction(action, learner);
    };

    return (
        <>
            <IconButton
                size="small"
                aria-label={`Actions for ${learner.name}`}
                aria-controls={
                    anchor
                        ? `learner-actions-${learner.enrollmentId}`
                        : undefined
                }
                aria-haspopup="menu"
                aria-expanded={anchor ? "true" : undefined}
                onClick={(event) => setAnchor(event.currentTarget)}
            >
                <MoreIcon />
            </IconButton>
            <Menu
                id={`learner-actions-${learner.enrollmentId}`}
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                MenuListProps={{ "aria-label": `Actions for ${learner.name}` }}
            >
                {actions.map((action, index) => [
                    index === 2 && actions.length > 2 ? (
                        <Divider key={`${action}-divider`} />
                    ) : null,
                    <MenuItem
                        key={action}
                        onClick={() => choose(action)}
                        sx={
                            action === "withdraw"
                                ? { color: "error.main" }
                                : undefined
                        }
                    >
                        <ListItemIcon>{icons[action]}</ListItemIcon>
                        <ListItemText>{ACTION_LABELS[action]}</ListItemText>
                    </MenuItem>,
                ])}
            </Menu>
        </>
    );
}
