<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notice Editor</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.ckeditor.com/4.20.2/standard/ckeditor.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

@vite('resources/css/app.css')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
<script src="https://cdn.ckeditor.com/4.16.2/standard/ckeditor.js"></script>    
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'inter': ['Inter', 'sans-serif'],
                    },
                    animation: {
                        'fade-in': 'fadeIn 0.6s ease-out',
                        'slide-up': 'slideUp 0.5s ease-out',
                        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
                    },
                    keyframes: {
                        fadeIn: {
                            '0%': { opacity: '0' },
                            '100%': { opacity: '1' },
                        },
                        slideUp: {
                            '0%': { transform: 'translateY(30px)', opacity: '0' },
                            '100%': { transform: 'translateY(0)', opacity: '1' },
                        },
                        pulseSoft: {
                            '0%, 100%': { opacity: '0.6' },
                            '50%': { opacity: '0.3' },
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        
        .glass-effect {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .form-container {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .form-container:hover {
            transform: translateY(-2px);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .editor-wrapper {
            transition: all 0.3s ease;
        }
        
        .editor-wrapper:hover {
            transform: translateY(-1px);
        }
        
        .cke_notifications_area {
            display: none !important;
        }
        
        .floating-background {
            position: absolute;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
            animation: float 6s ease-in-out infinite;
        }
        
        .floating-background:nth-child(1) {
            width: 200px;
            height: 200px;
            top: 10%;
            left: 10%;
            animation-delay: 0s;
        }
        
        .floating-background:nth-child(2) {
            width: 300px;
            height: 300px;
            top: 60%;
            right: 10%;
            animation-delay: 2s;
        }
        
        .floating-background:nth-child(3) {
            width: 150px;
            height: 150px;
            bottom: 20%;
            left: 20%;
            animation-delay: 4s;
        }
        
        @keyframes float {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0.4;
            }
            50% {
                transform: translateY(-20px) rotate(180deg);
                opacity: 0.6;
            }
        }
        
        .gradient-border {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2px;
            border-radius: 1rem;
        }
        
        .gradient-border > div {
            background: white;
            border-radius: calc(1rem - 2px);
        }
        
        .btn-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-gradient:hover {
            background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
            transform: translateY(-2px);
            box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
        }
        
        .btn-gradient:active {
            transform: translateY(0);
        }
        
        .title-gradient {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100 flex items-center justify-center p-6 overflow-auto">
    <!-- Floating Background Elements -->
    <div class="floating-background"></div>
    <div class="floating-background"></div>
    <div class="floating-background"></div>
    
    <!-- Main Container -->
    <div class="relative w-full max-w-4xl mx-auto my-8 animate-fade-in">
        <div class="form-container glass-effect rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <!-- Header Section -->
            <div class="relative bg-gradient-to-r from-blue-800 via-blue-700 to-blue-900 px-8 py-8">
                <div class="absolute inset-0 bg-black/10"></div>
                <div class="relative p-6">
                    <h1 class="text-4xl font-bold text-white mb-3">Notice Editor</h1>
                    <p class="text-gray-300 text-lg font-medium">Create and manage important announcements</p>
                </div>
                <div class="absolute top-4 right-8 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse-soft"></div>
                <div class="absolute bottom-4 right-12 w-8 h-8 bg-white/20 rounded-full blur-lg animate-pulse-soft" style="animation-delay: 1s;"></div>
            </div>

            <div class="p-10 space-y-8">
                <form method="POST" action="#" class="space-y-8">
                    @csrf
                    <!-- Hidden textarea for CKEditor -->
                    <textarea id="content" name="content" rows="10" class="hidden"></textarea>

                    <!-- Action Section -->
                    <div class="pt-8 border-t border-gray-200">
                        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button type="button" 
                                    class="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-300 border-2 border-transparent hover:border-gray-300 min-w-[140px]">
                                Cancel
                            </button>
                            
                            <button type="submit"
                                    class="btn-gradient w-full sm:w-auto text-white font-bold px-10 py-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 text-lg min-w-[140px]">
                                Save Notice
                            </button>
                        </div>
                        
                        <div class="text-center mt-6">
                            <p class="text-sm text-gray-500">
                                Your notice will be published immediately upon saving
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Bottom decorative element -->
        <div class="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full opacity-50"></div>
    </div>

    <script>
        // Initialize CKEditor with enhanced configuration
        CKEDITOR.replace('content', {
            height: 400,
            resize_enabled: false,
            toolbar: [
                { name: 'document', items: ['Source', '-', 'Save', 'NewPage', 'Preview', 'Print'] },
                { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
                { name: 'editing', items: ['Find', 'Replace', '-', 'SelectAll'] },
                '/',
                { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat'] },
                { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
                { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
                '/',
                { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
                { name: 'colors', items: ['TextColor', 'BGColor'] },
                { name: 'tools', items: ['Maximize', 'ShowBlocks'] }
            ],
            // Enhanced styling
            contentsCss: [
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
                'body { font-family: "Inter", sans-serif; font-size: 16px; line-height: 1.6; padding: 20px; }'
            ],
            // Remove notifications
            notification_duration: 0,
            // Enhanced config
            enterMode: CKEDITOR.ENTER_P,
            shiftEnterMode: CKEDITOR.ENTER_BR,
            autoParagraph: false,
            fillEmptyBlocks: false
        });

        // Add smooth loading animation
        CKEDITOR.on('instanceReady', function(evt) {
            const editor = evt.editor;
            const container = document.getElementById('ckeditor-container');
            
            // Add a subtle animation when editor is ready
            setTimeout(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 100);
        });

        // Handle form submission
        document.querySelector('form').addEventListener('submit', function(e) {
            // Update textarea with CKEditor content
            const editorData = CKEDITOR.instances.content.getData();
            document.getElementById('content').value = editorData;
            
            // Add loading state to button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;
            
            // Re-enable after a moment (remove in real implementation)
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    </script>
</body>
</html>