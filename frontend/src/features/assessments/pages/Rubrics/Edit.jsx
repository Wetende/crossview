import React from "react";
import { Head } from "@inertiajs/react";
import DashboardLayout from "@/layouts/DashboardLayout";
import RubricForm from "./RubricForm";

const RubricEdit = ({ rubric }) => {
    return (
        <DashboardLayout>
            <Head title={`Edit ${rubric.name}`} />
            <RubricForm rubric={rubric} />
        </DashboardLayout>
    );
};

export default RubricEdit;
