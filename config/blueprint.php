<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Required Properties Per Node Type
    |--------------------------------------------------------------------------
    |
    | Define which properties are required for each node type. These will be
    | validated when saving curriculum nodes.
    |
    */
    'required_properties' => [
        'lesson' => ['title'],
        'session' => ['title'],
        'competency' => ['title'],
        'element' => ['title'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Blueprints
    |--------------------------------------------------------------------------
    |
    | Pre-configured blueprints that can be used as templates.
    |
    */
    'default_blueprints' => [
        'theology' => [
            'name' => 'CCT Theology Standard',
            'hierarchy_structure' => ['Year', 'Unit', 'Session'],
            'grading_logic' => [
                'type' => 'weighted',
                'pass_mark' => 40,
                'components' => [
                    ['name' => 'CAT', 'weight' => 0.3],
                    ['name' => 'Exam', 'weight' => 0.7],
                ],
            ],
        ],
        'tvet' => [
            'name' => 'TVET CDACC Standard',
            'hierarchy_structure' => ['Level', 'Module', 'Competency', 'Element'],
            'grading_logic' => [
                'type' => 'competency',
                'competency_labels' => [
                    'pass' => 'Competent',
                    'fail' => 'Not Yet Competent',
                ],
            ],
        ],
        'online' => [
            'name' => 'Online Course Standard',
            'hierarchy_structure' => ['Course', 'Section', 'Lesson'],
            'grading_logic' => [
                'type' => 'pass_fail',
            ],
        ],
    ],
];
