import React from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/layouts/DashboardLayout";
import RubricForm from "./RubricForm";

const RubricCreate = () => {
    return (
        <DashboardLayout>
            <Head title="Create Rubric" />
            <RubricForm />
        </DashboardLayout>
    );
};

export default RubricCreate;
