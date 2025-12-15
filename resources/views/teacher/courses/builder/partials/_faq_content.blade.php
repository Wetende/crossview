<!DOCTYPE        body {
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .faq-box {html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FAQ Management</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
    <style>
        .faq-box {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
        }
        .faq-box:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .input-focus {
            transition: all 0.3s ease;
        }
        .input-focus:focus {
            transform: scale(1.02);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
        }
        .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            transition: all 0.3s ease;
        }
        .btn-success:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
        }
        .slide-down {
            animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
</head>
<body class="gradient-bg min-h-screen flex items-center justify-center p-4 overflow-x-hidden">
    <div class="glass-effect shadow-2xl rounded-3xl w-full max-w-3xl mx-auto p-8 space-y-8 my-8" x-data="faqManager()">
        <!-- Header -->
        <div class="text-center space-y-2">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                <i class="fas fa-question-circle text-white text-2xl"></i>
            </div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Frequently Asked Questions
            </h1>
            <p class="text-gray-600">Manage your FAQ content with ease</p>
        </div>

        <!-- FAQ Items -->
        <div class="space-y-4">
            <template x-for="(faq, index) in faqs" :key="index">
                <div class="faq-box bg-white/70 border border-white/30 rounded-2xl p-6 shadow-lg">
                    <div class="flex justify-between items-center cursor-pointer" @click="faq.open = !faq.open">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span class="text-white text-sm font-semibold" x-text="index + 1"></span>
                            </div>
                            <h2 class="font-semibold text-gray-800" x-text="faq.question || `Question ${index + 1}`"></h2>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                <i class="fas fa-edit mr-1"></i>
                                <span x-text="faq.open ? 'Collapse' : 'Expand'"></span>
                            </span>
                            <svg x-show="!faq.open" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            <svg x-show="faq.open" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                            </svg>
                        </div>
                    </div>
                    
                    <div x-show="faq.open" x-transition:enter="slide-down" class="mt-6 space-y-4">
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <label class="flex items-center text-sm font-medium text-gray-700">
                                    <i class="fas fa-question-circle mr-2 text-blue-500"></i>
                                    Question
                                </label>
                                <input type="text" 
                                       x-model="faq.question"
                                       class="input-focus w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80" 
                                       placeholder="Type your question...">
                            </div>
                            <div class="space-y-2 md:col-span-1">
                                <label class="flex items-center text-sm font-medium text-gray-700">
                                    <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>
                                    Category
                                </label>
                                <select x-model="faq.category" class="input-focus w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80">
                                    <option value="">Select category</option>
                                    <option value="general">General</option>
                                    <option value="technical">Technical</option>
                                    <option value="billing">Billing</option>
                                    <option value="support">Support</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="space-y-2">
                            <label class="flex items-center text-sm font-medium text-gray-700">
                                <i class="fas fa-comment-dots mr-2 text-green-500"></i>
                                Answer
                            </label>
                            <textarea rows="4" 
                                      x-model="faq.answer"
                                      class="input-focus w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/80 resize-none" 
                                      placeholder="Write a comprehensive answer..."></textarea>
                        </div>
                        
                        <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                            <button @click="removeFaq(index)" class="text-red-500 hover:text-red-700 transition-colors flex items-center space-x-2">
                                <i class="fas fa-trash-alt"></i>
                                <span>Delete</span>
                            </button>
                            <div class="flex space-x-3">
                                <button @click="faq.open = false" class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                                    Cancel
                                </button>
                                <button @click="saveFaq(index)" class="btn-primary text-white px-6 py-2 rounded-xl font-medium flex items-center space-x-2">
                                    <i class="fas fa-save"></i>
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- Add New Question Button -->
        <div class="text-center pt-4">
            <button @click="addNewFaq()" class="btn-success text-white px-8 py-3 rounded-2xl font-semibold flex items-center space-x-3 mx-auto">
                <i class="fas fa-plus-circle text-lg"></i>
                <span>Add New Question</span>
            </button>
        </div>

        <!-- Stats -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 mt-6">
            <div class="flex justify-center items-center space-x-8 text-sm">
                <div class="text-center">
                    <div class="font-bold text-lg text-blue-600" x-text="faqs.length"></div>
                    <div class="text-gray-600">Total FAQs</div>
                </div>
                <div class="text-center">
                    <div class="font-bold text-lg text-green-600" x-text="faqs.filter(f => f.question && f.answer).length"></div>
                    <div class="text-gray-600">Completed</div>
                </div>
                <div class="text-center">
                    <div class="font-bold text-lg text-orange-600" x-text="faqs.filter(f => !f.question || !f.answer).length"></div>
                    <div class="text-gray-600">Draft</div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <script>
        function faqManager() {
            return {
                faqs: [
                    { 
                        question: 'How do I get started?', 
                        answer: 'Getting started is easy! Simply sign up for an account and follow our quick setup guide.',
                        category: 'general',
                        open: true 
                    },
                    { 
                        question: 'What payment methods do you accept?', 
                        answer: 'We accept all major credit cards, PayPal, and bank transfers.',
                        category: 'billing',
                        open: false 
                    }
                ],
                
                addNewFaq() {
                    this.faqs.push({
                        question: '',
                        answer: '',
                        category: '',
                        open: true
                    });
                },
                
                removeFaq(index) {
                    if (confirm('Are you sure you want to delete this FAQ?')) {
                        this.faqs.splice(index, 1);
                    }
                },
                
                saveFaq(index) {
                    // Here you would typically save to your backend
                    alert('FAQ saved successfully!');
                    this.faqs[index].open = false;
                }
            }
        }
    </script>
</body>
</html>