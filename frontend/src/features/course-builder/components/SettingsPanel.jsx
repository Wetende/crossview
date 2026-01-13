import React from 'react';
import { useForm, router } from '@inertiajs/react'; // Ensure router is imported
import { 
    Box, 
    Typography, 
    Stack, 
    Button, 
} from '@mui/material';
import { PricingEditor, FAQEditor, NoticeEditor } from './SettingsEditors';
import DripEditor from './DripEditor';

export default function SettingsPanel({ program, activeTab, curriculum }) {
    // We maintain local state for all tabs and save on demand
    const { data: formData, setData, post, processing } = useForm({
        custom_pricing: program.customPricing || {},
        faq: program.faq || [],
        notices: program.notices || [],
        // description, code etc. not supported by backend view yet
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
