import React from 'react'
import { Head } from '@inertiajs/react'

export default function Home({ message }) {
  return (
    <>
      <Head title="Home - Crossview LMS" />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-emerald-800 mb-4">
              Crossview LMS
            </h1>
            <p className="text-xl text-emerald-600 mb-8">
              {message || 'Modern Learning Management System'}
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                Get Started
              </button>
              <button className="px-6 py-3 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition">
                Learn More
              </button>
            </div>
          </div>
          
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Blueprint Engine"
              description="Define academic structures with flexible hierarchies and grading systems"
              icon="📐"
            />
            <FeatureCard 
              title="Assessment Engine"
              description="Weighted, competency-based, and pass/fail grading strategies"
              icon="📝"
            />
            <FeatureCard 
              title="Progression Tracking"
              description="Sequential and prerequisite-based learning paths"
              icon="📈"
            />
            <FeatureCard 
              title="Content Parser"
              description="PDF extraction with automatic session generation"
              icon="📄"
            />
            <FeatureCard 
              title="Practicum System"
              description="Evidence-based submissions with rubric scoring"
              icon="🎯"
            />
            <FeatureCard 
              title="Certifications"
              description="Auto-generated certificates with verification"
              icon="🏆"
            />
          </div>
        </div>
      </div>
    </>
  )
}

function FeatureCard({ title, description, icon }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
