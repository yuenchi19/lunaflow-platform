import LessonView from "@/components/student/LessonView";

export default function StudentLessonPage({ params }: { params: { id: string; blockId: string } }) {
    return <LessonView courseId={params.id} blockId={params.blockId} />;
}
