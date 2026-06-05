// implement SuperMemo 2 (SM-2) algorithm for calculating optimal space repetition frequency
export function sm2(
    quality: number,
    repetitions: number,
    easeFactor: number,
    interval: number
): { repetitions: number; easeFactor: number; interval: number } {

    // depending on quality of answer, calculates how long you should wait till you review it based on number of repetitions completed thus far
    if (quality >= 3) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetitions++;
    } else {
        repetitions = 0;
        interval = 1;
    }

    easeFactor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    return { repetitions, easeFactor, interval };
}
