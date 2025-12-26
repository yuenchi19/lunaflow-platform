export const storage = {
    getCourses: () => {
        const data = localStorage.getItem('courses');
        return data ? JSON.parse(data) : [
            { id: "oEjM3gDl6MgB", title: "テスト", label: "基礎編", categoryCount: 1, studentCount: 0 }
        ];
    },
    saveCourses: (courses: any[]) => {
        localStorage.setItem('courses', JSON.stringify(courses));
    },
    getCategories: (courseId: string) => {
        const data = localStorage.getItem(`categories_${courseId}`);
        return data ? JSON.parse(data) : [
            { id: 'cat1', title: 'サブ', isPublic: false, blockCount: 0 }
        ];
    },
    saveCategories: (courseId: string, categories: any[]) => {
        localStorage.setItem(`categories_${courseId}`, JSON.stringify(categories));
    },
    getBlocks: (categoryId: string) => {
        const data = localStorage.getItem(`blocks_${categoryId}`);
        return data ? JSON.parse(data) : [];
    },
    saveBlocks: (categoryId: string, blocks: any[]) => {
        localStorage.setItem(`blocks_${categoryId}`, JSON.stringify(blocks));
    },
    getStaff: () => {
        const data = localStorage.getItem('staff');
        return data ? JSON.parse(data) : [
            { id: 's1', name: '山田 太郎', email: 'yamada@example.com', role: 'admin', status: 'active', lastLogin: '2023-12-21 10:30' },
            { id: 's2', name: '佐藤 花子', email: 'sato@example.com', role: 'accounting', status: 'active', lastLogin: '2023-12-20 15:45' },
            { id: 's3', name: '鈴木 一郎', email: 'suzuki@example.com', role: 'staff', status: 'inactive', lastLogin: '2023-11-15 09:00' },
        ];
    },
    saveStaff: (staff: any[]) => {
        localStorage.setItem('staff', JSON.stringify(staff));
    }
};
