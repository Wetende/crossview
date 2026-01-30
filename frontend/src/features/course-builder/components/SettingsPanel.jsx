import React from 'react';
import { useForm, router } from '@inertiajs/react'; // Ensure router is imported
import { 
    Box, 
    Typography, 
    Stack, 
    Button,
    Alert,
    TextField,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { PricingEditor, FAQEditor, NoticeEditor } from './SettingsEditors';
import DripEditor from './DripEditor';

export default function SettingsPanel({ program, activeTab, curriculum, platformFeatures = {}, deploymentMode = 'custom' }) {
    // We maintain local state for all tabs and save on demand
    const { data: formData, setData, post, processing } = useForm({
        custom_pricing: program.customPricing || {},
        faq: program.faq || [],
        notices: program.notices || [],
        // Mode-conditional fields (Gamification is NOT here - it's platform-level)
        access_duration_days: program.accessDurationDays || null,
        prerequisites_enabled: program.prerequisitesEnabled || false,
        practicum_rules: program.practicumRules || {},
    });

    const handleSubmit = () => {
        post(`/instructor/programs/${program.id}/manage/settings/`, {
            preserveScroll: true,
            onSuccess: () => {
                // optional toast
            }
        });
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'pricing':
                return <PricingEditor data={formData.custom_pricing} onChange={val => setData('custom_pricing', val)} />;
            case 'faq':
                return <FAQEditor data={formData.faq} onChange={val => setData('faq', val)} />;
            case 'notice':
                return <NoticeEditor data={formData.notices} onChange={val => setData('notices', val)} />;
            case 'drip':
                return <DripEditor program={program} curriculum={curriculum} />;
            
            // New mode-conditional tabs
            case 'practicum':
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight="bold">Practicum Settings</Typography>
                        <Alert severity="info">
                            Configure requirements for hands-on/practical submissions in this course.
                            Students will upload videos, images, or documents as evidence of competency.
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                            Practicum rules are configured per-lesson in the Curriculum tab. 
                            Enable "Requires Upload" on individual lessons to require practicum submissions.
                        </Typography>
                        <Button variant="outlined" onClick={() => router.visit(`/instructor/programs/${program.id}/manage/`)}>
                            Go to Curriculum
                        </Button>
                    </Stack>
                );
            
            // Note: Gamification case removed - it's a platform-level feature configured in Admin settings
            
            case 'prerequisites':
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight="bold">Prerequisites</Typography>
                        <Alert severity="info">
                            Require students to complete other courses before enrolling in this one.
                            {deploymentMode === 'tvet' && ' TVET mode: Consider KNQF level sequencing (Level 3 before Level 4).'}
                        </Alert>
                        <FormControlLabel
                            control={<Switch checked={formData.prerequisites_enabled} onChange={e => setData('prerequisites_enabled', e.target.checked)} />}
                            label="Require prerequisites for this course"
                        />
                        <Typography variant="body2" color="text.secondary">
                            Full prerequisites selection will be available in the next update.
                        </Typography>
                    </Stack>
                );
            
            case 'access':
                return (
                    <Stack spacing={3}>
                        <Typography variant="h6" fontWeight="bold">Access & Time Limits</Typography>
                        <Alert severity="info">
                            Set how long students have access to this course after enrollment.
                            Leave blank for unlimited access.
                        </Alert>
                        <TextField
                            label="Access duration (days)"
                            type="number"
                            value={formData.access_duration_days || ''}
                            onChange={e => setData('access_duration_days', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="e.g. 365 for 1 year"
                            helperText="Students will lose access after this many days from enrollment"
                        />
                        <FormControlLabel
                            control={<Switch defaultChecked={false} />}
                            label="Show expiration warning (7 days before)"
                        />
                    </Stack>
                );
            
            case 'settings':
            default:
                 return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">General settings (Description, etc.) are managed in the main program details.</Typography>
                        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => router.visit(`/instructor/programs/${program.id}/edit`)}>
                            Go to Main Edit Page
                        </Button>
                    </Box>
                 );
        }
    };

    return (
        <Stack spacing={3}>
            {renderContent()}
            
            {activeTab !== 'settings' && activeTab !== 'drip' && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Button variant="contained" onClick={handleSubmit} disabled={processing} size="large">
                        Save Changes
                    </Button>
                </Box>
            )}
        </Stack>
    );
}

