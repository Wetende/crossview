As the Senior Developer for Crossview College of Theology and Technology (CCT&T), I am architecting this LMS to be **engine-driven** rather than hard-coded. This ensures that when you transition to a TVET college or franchise this software to other institutions, you only change the *configuration*, not the *code*.

Here is the production-level architecture, user flows, and MySQL 8.0 database schema.

### 1. Core System Logics (The "Engines")

We will build three decoupled engines to handle the flexibility you require.

#### **A. The Blueprint Engine (Structure Logic)**

This is the heart of your flexibility. It prevents us from hard-coding terms like "Semester" or "Session."

* **Logic:** The system does not know what a "course" is. It only knows "Nodes" in a tree.
* 
**Theology Config:** Defined as `Program -> Year -> Unit -> Session` (based on your *Basic Homiletics* doc ).


* **TVET Config:** Defined as `Qualification -> Level -> Module -> Unit of Competency`.
* **Behavior:** When a student clicks a course, the engine reads the `blueprint_id` to decide if it should render a list of "Sessions" (Theology) or a list of "Competencies" (TVET).

#### **B. The Assessment Engine (Grading Logic)**

* **Theology Logic:** Uses a **Weighted Sum** strategy.
* *Input:* `CAT (30%)` + `Exam (70%)`.
* 
*Rule:* If `Total < 40`, status = `Referral`.




* **TVET Logic:** Uses a **Binary Check** strategy.
* *Input:* `Practical Observation` + `Portfolio of Evidence`.
* *Rule:* If all required evidences are present, status = `Competent`.



#### **C. The Progression Engine (Access Logic)**

* 
**Sequential Locking:** For courses like *Basic Homiletics*, you can force students to view "Session 1: The Need for Effective Preaching"  before unlocking "Session 2".


* 
**Prerequisite Locking:** A student cannot register for `DOT109 Old Testament Survey` until they complete `DFF 106 Foundations of Faith`.



---

### 2. User Flows

#### **Flow A: Student Learning (Theology Track)**

*Persona: A student enrolled in Diploma in Church Leadership.*

1. **Login:** Student lands on Dashboard. System checks `enrollment` table.
2. **Dashboard Render:**
* System detects `blueprint_type = 'theology'`.
* Renders a card for **"DH104: Basic Homiletics"**.




3. **Course Entry:**
* Student clicks "DH104".
* System queries `curriculum_nodes` using a Recursive CTE to fetch the tree.
* 
**UI Display:** Shows a timeline of 6 Sessions (as per your uploaded syllabus ).




4. **Session Interaction:**
* Student clicks **"Session 1"**.
* System loads content from the `properties` JSON (PDF notes, Audio lecture).
* Student marks "Complete".


5. **Progression:** System unlocks **"Session 2"**.

#### **Flow B: Registrar/Admin (Configuration)**

*Persona: You, setting up the system for the future TVET transition.*

1. **Blueprint Creation:** Admin goes to "Settings > Academic Structures".
2. **Define Hierarchy:**
* Admin creates new Blueprint: "TVET CDACC Level 6".
* Defines Levels: `Level 1: Qualification`, `Level 2: Unit of Competency`, `Level 3: Element`.


3. **Define Grading:**
* Selects "Competency Based".
* Sets labels: "Competent" / "Not Yet Competent".


4. **Result:** The system is now ready for TVET students without writing code.

---

### 3. MySQL 8.0 Database Schema

This schema uses **JSON columns** for flexibility and **Recursive CTEs** for hierarchy management.

```sql
-- 1. USERS & ROLES
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('student', 'lecturer', 'admin', 'registrar') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACADEMIC BLUEPRINTS (The Config Engine)
-- This table stores the "Rules" for different types of programs.
CREATE TABLE academic_blueprints (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g. "CCT Theology Diploma", "TVET CDACC"
    
    -- CONFIGURATION JSONs
    -- Defines the tree structure labels (e.g. ["Year", "Unit", "Session"])
    hierarchy_structure JSON NOT NULL, 
    
    -- Defines grading logic (e.g. {"type": "weighted", "pass_mark": 40})
    grading_logic JSON NOT NULL
);

-- 3. PROGRAMS (Linked to a Blueprint)
CREATE TABLE programs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    blueprint_id INT UNSIGNED NOT NULL, -- Inherits the logic from here
    [cite_start]name VARCHAR(255) NOT NULL, -- e.g. "Diploma in Bible and Mission" [cite: 2004]
    code VARCHAR(50), -- e.g. "DBM"
    FOREIGN KEY (blueprint_id) REFERENCES academic_blueprints(id)
);

-- 4. CURRICULUM NODES (The Universal Content Tree)
-- This table holds EVERYTHING: Years, Units, Sessions, Topics.
CREATE TABLE curriculum_nodes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    program_id INT UNSIGNED NOT NULL,
    parent_id BIGINT UNSIGNED NULL, -- Self-referencing for tree structure
    
    -- Type determines behavior (e.g. 'unit' has a code, 'session' has content)
    node_type VARCHAR(50) NOT NULL, -- 'year', 'unit', 'session', 'module'
    
    [cite_start]title VARCHAR(255) NOT NULL, -- e.g. "Basic Homiletics" [cite: 731]
    code VARCHAR(50), -- e.g. [cite_start]"DH104" [cite: 730]
    
    -- DYNAMIC CONTENT STORE
    -- For a Unit: {"credit_hours": 3}
    -- For a Session: {"pdf_url": "homiletics.pdf", "video_url": "..."}
    properties JSON,
    
    FOREIGN KEY (program_id) REFERENCES programs(id),
    FOREIGN KEY (parent_id) REFERENCES curriculum_nodes(id) ON DELETE CASCADE
);

-- 5. ENROLLMENTS & PROGRESS
CREATE TABLE enrollments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT UNSIGNED NOT NULL,
    program_id INT UNSIGNED NOT NULL,
    
    -- Tracks current position in the tree
    current_node_id BIGINT UNSIGNED NULL, 
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (program_id) REFERENCES programs(id)
);

-- 6. ASSESSMENT RESULTS (Flexible Storage)
CREATE TABLE assessment_results (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id BIGINT UNSIGNED NOT NULL,
    node_id BIGINT UNSIGNED NOT NULL, -- Which Unit/Session is this for?
    
    -- Stores the grades based on the Blueprint's logic
    -- Theology: {"cat": 25, "exam": 60, "total": 85, "grade": "A"}
    -- TVET: {"observation": "pass", "portfolio": "pass", "status": "Competent"}
    result_data JSON NOT NULL,
    
    lecturer_comments TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id),
    FOREIGN KEY (node_id) REFERENCES curriculum_nodes(id)
);

```

### 4. Key Logic: The Recursive Tree Fetcher

This is the exact SQL logic you will use in your API (Node/Python/PHP) to fetch the course content for *Basic Homiletics*  while maintaining the structure defined in your PDF.

```sql
-- LOGIC: Fetch full syllabus tree for "Diploma in Bible and Mission"
WITH RECURSIVE syllabus_tree AS (
    -- Anchor: Get the Root (The Program)
    SELECT id, parent_id, title, node_type, code, properties, 1 as depth
    FROM curriculum_nodes 
    WHERE program_id = 1 AND parent_id IS NULL
    
    UNION ALL
    
    -- Recursive: Get children (Years -> Units -> Sessions)
    SELECT child.id, child.parent_id, child.title, child.node_type, child.code, child.properties, parent.depth + 1
    FROM curriculum_nodes child
    INNER JOIN syllabus_tree parent ON child.parent_id = parent.id
)
SELECT * FROM syllabus_tree ORDER BY depth, id;

```

**Why this works for Crossview:**

1. 
DFF 106 & DH104: These are stored as `nodes` with `node_type='unit'`.


2. 
Sessions: The children of DH104 are stored as `nodes` with `node_type='session'`.


3. **Flexibility:** When you add a TVET course, you just insert nodes with `node_type='competency'` instead. The database structure does not change.