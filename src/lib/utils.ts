export const calculateStudentStatus = (user: any) => {
    // Defaults
    const regDate = user.registrationDate ? new Date(user.registrationDate) : new Date("2025-01-01");
    // Ensure we don't get negative months if date is in future (though unlikely)
    const now = new Date().getTime();
    const regTime = regDate.getTime();
    const diff = now - regTime;

    // Calculate full months elapsed more accurately
    // Simplification: 30 days per month
    const monthsElapsed = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const currentTotal = user.lifetimePurchaseTotal || 0;

    let requiredMonths = 0;
    let requiredTotal = 0;

    // Plan Logic based on User Request
    if (user.plan === 'premium') {
        requiredMonths = 10;
        // 30k * 10 = 300k
        requiredTotal = 30000 * 10;
    } else if (user.plan === 'standard') {
        requiredMonths = 11;
        // 60k * 11 = 660k
        requiredTotal = 60000 * 11;
    } else if (user.plan === 'light') {
        requiredMonths = 12;
        // 80k * 12 = 960k
        requiredTotal = 80000 * 12;
    }

    const isDurationOk = monthsElapsed >= requiredMonths;
    const purchaseDeficit = Math.max(0, requiredTotal - currentTotal);
    const isPurchaseOk = purchaseDeficit === 0;

    return {
        monthsElapsed: Math.max(0, monthsElapsed), // Prevent negative
        requiredMonths,
        currentTotal,
        requiredTotal,
        purchaseDeficit,
        isDurationOk,
        isPurchaseOk
    };
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};
