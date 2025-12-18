Project Genesis: The Crossview "Universal" LMS
1. Executive Summary: The Chameleon Engine
We are not building a standard LMS. We are building an Educational Infrastructure Engine that solves the fragmentation in the Kenyan education market.

Standard LMS platforms are rigid: they assume every school runs on "Semesters" and "Exams." This fails in Kenya, where a single institution like Crossview College must simultaneously run:

Theological Programs: Reflective, session-based, and academic.

TVET Programs: Strictly regulated by CDACC (Competency-Based Education and Training - CBET).

Short Courses: Market-driven, certificate-based.

The Solution: We have abstracted the "Academic Structure" into a configuration layer called "The Blueprint."

The Code doesn't know what a "Semester" or "Competency" is. It only knows Nodes.

The Database stores a JSON "Blueprint" that defines the terminology and rules.

The Result: The system acts like a chameleon. It changes its entire behavior, terminology, and grading logic instantly based on the "Preset" selected.

2. The Five Strategic Presets (Production-Ready JSON)
These presets are based on deep research into the specific regulatory requirements of Kenyan bodies (TVETA/CDACC, NITA, NTSA, KICD). You can load these directly into your academic_blueprints table.

Preset A: "TVET Standard (CDACC)"
Target Market: Technical Institutes, National Polytechnics, Future-Crossview. Regulatory Source: TVET CDACC Assessment Guidelines.

The Logic:

Hierarchy: CDACC strictly follows Qualification → Module (Basic/Common/Core) → Unit of Competency → Element → Performance Criteria.

Assessment: Requires a "Portfolio of Evidence (PoE)" and practical verification.

Grading: Binary "Competent (C)" or "Not Yet Competent (NYC)" with a 50% pass mark threshold.

Database Config (JSON):

JSON

{
  "name": "TVET CDACC Standard",
  "hierarchy_labels": ["Qualification", "Module", "Unit of Competency", "Element"],
  "structure_rules": {
    "module_types": ["Basic", "Common", "Core"],
    "element_components": ["Performance Criteria", "Range"]
  },
  "grading_config": {
    "mode": "cbet",
    "scale": ["Competent", "Not Yet Competent"],
    "pass_mark": 50,
    "requirements": [
      {"key": "theory", "label": "Continuous Assessment", "weight": 0.3},
      {"key": "practical", "label": "Practical Project", "weight": 0.7},
      {"key": "portfolio", "label": "Portfolio of Evidence (PoE)", "required": true}
    ]
  }
}
Preset B: "The NITA Artisan" (Trade Test)
Target Market: Vocational Training Centers, Jua Kali Associations, Mechanics, Masons. Regulatory Source: National Industrial Training Authority (NITA) Guidelines.

The Logic:

Hierarchy: NITA uses "Grades" rather than Years. Trade Area → Grade Level (III, II, I) → Practical Project.

Assessment: 100% Practical. "Test Papers" are often technical drawings or physical tasks (e.g., "Wire a 3-phase circuit").

Database Config (JSON):

JSON

{
  "name": "NITA Trade Test",
  "hierarchy_labels": ["Trade Area", "Grade Level", "Practical Project"],
  "structure_rules": {
    "levels": ["Grade III (Entry)", "Grade II", "Grade I (Advanced)"]
  },
  "grading_config": {
    "mode": "visual_review",
    "upload_type": "media_gallery",
    "checklist": ["Safety Gear Worn", "Tools Handled Correctly", "Finished Product Quality"]
  }
}
Preset C: "The Driving School (NTSA)"
Target Market: Driving Schools (AA Kenya, Rocky, etc.). Regulatory Source: NTSA Curriculum for Training, Testing and Licensing.

The Logic:

Hierarchy: License Class → Unit (e.g., Basic Mechanics, Traffic Rules) → Lesson (Theory/Yard/Road).

Assessment: NTSA requires a specific log of hours for "Yard Training" and "Roadwork."

Mechanism: Instructor checklist on mobile.

Database Config (JSON):

JSON

{
  "name": "NTSA Driving Curriculum",
  "hierarchy_labels": ["License Class", "Unit", "Lesson Type"],
  "structure_rules": {
    "lesson_types": ["Theory", "Yard Training", "Roadwork"]
  },
  "grading_config": {
    "mode": "instructor_checklist",
    "tracking": "hours_logged",
    "components": [
      {"key": "theory", "label": "Theory Test", "required": true},
      {"key": "yard", "label": "Maneuver Test", "required": true},
      {"key": "road", "label": "Road Test", "required": true}
    ]
  }
}
Preset D: "The CBC (K-12)"
Target Market: Private Primary & Junior Secondary Schools. Regulatory Source: KICD Basic Education Curriculum Framework.

The Logic:

Hierarchy: Grade → Learning Area → Strand → Sub-strand → Specific Learning Outcome.

Assessment: Uses a 4-point rubric, not percentages.

Core Competencies: Must track soft skills like "Communication" and "Critical Thinking".

Database Config (JSON):

JSON

{
  "name": "CBC K-12 Standard",
  "hierarchy_labels": ["Grade", "Learning Area", "Strand", "Sub-strand"],
  "grading_config": {
    "mode": "rubric",
    "levels": [
      {"score": 4, "label": "Exceeding Expectation"},
      {"score": 3, "label": "Meeting Expectation"},
      {"score": 2, "label": "Approaching Expectation"},
      {"score": 1, "label": "Below Expectation"}
    ],
    "competencies_tracking": ["Communication", "Critical Thinking", "Digital Literacy"]
  }
}
Preset E: "The Crossview Theology (Legacy)"
Target Market: Bible Schools, Theological Seminaries. Source: Crossview Internal Documents (Basic Homiletics).

The Logic:

Hierarchy: Program → Year → Unit → Session.

Assessment: Academic. Weighted sum of CATs and Exams.

Feature: "Practicum" uploads (Sermon recordings).

Database Config (JSON):

JSON

{
  "name": "CCT Theology Standard",
  "hierarchy_labels": ["Program", "Year", "Unit", "Session"],
  "grading_config": {
    "mode": "summative",
    "pass_mark": 40,
    "components": [
      {"key": "cat", "label": "Continuous Assessment", "weight": 0.3},
      {"key": "exam", "label": "Final Examination", "weight": 0.7}
    ]
  }
}
3. Technical Implementation Strategy
1. The Database Schema (MySQL 8.0)
Use JSON columns to store the flexibility and Recursive CTEs to query the hierarchy efficiently.

SQL

-- The "Chameleon" Tables
CREATE TABLE academic_blueprints (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100), 
    hierarchy_labels JSON, -- Stores the ["Qualification", "Module"] array
    grading_config JSON -- Stores the grading logic
);

CREATE TABLE curriculum_nodes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    blueprint_id BIGINT UNSIGNED,
    parent_id BIGINT UNSIGNED NULL, -- Recursive Parent
    node_type VARCHAR(50), -- 'unit', 'session', 'element', 'strand'
    title VARCHAR(255),
    properties JSON, -- Stores 'performance_criteria' or 'pdf_url'
    completion_rules JSON -- Stores 'requires_portfolio_upload'
);
2. The Logic Engine (Laravel Service)
Do not write if ($course->type == 'tvet'). Instead, write a parser:

PHP

public function calculateGrade($enrollment, $blueprint) {
    $config = $blueprint->grading_config;
    
    if ($config['mode'] === 'cbet') {
        // TVET Logic: Check if Portfolio exists
        return $this->checkCompetency($enrollment, $config['requirements']);
    } 
    
    if ($config['mode'] === 'summative') {
        // Theology Logic: Calculate Weighted Sum
        return $this->calculateWeightedSum($enrollment, $config['components']);
    }
}
4. Strategic Advantage
Regulatory Compliance: You are the only platform that can natively output a "CDACC Portfolio" for one student and a "CBC Rubric Report" for another.

Future Proofing: When Crossview becomes a TVET college, you simply switch the Preset. You don't rebuild the LMS.

Market Dominance: You can sell to any educational entity in Eldoret—from the Driving School next door to the National Polytechnic—using the same codebase.