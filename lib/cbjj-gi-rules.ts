export interface WeightClass {
    name: string;
    min_weight: number;
    max_weight: number;
}

export type AgeGroupDivision = 'Kids' | 'Juvenil' | 'Adulto' | 'Master' | 'Unknown';

/**
 * Mapeamento determinístico do nome da age_group para a divisão CBJJ.
 */
export function getAgeGroupDivision(name: string): AgeGroupDivision {
    const n = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (n.includes("pre-mirim") || n.includes("mirim") || n.includes("infantil") || n.includes("infanto-juvenil")) {
        return 'Kids';
    }
    if (n.includes("juvenil") && !n.includes("infanto")) {
        return 'Juvenil';
    }
    if (n.includes("adulto")) {
        return 'Adulto';
    }
    if (n.includes("master")) {
        return 'Master';
    }

    return 'Unknown';
}

/**
 * Verifica se a faixa é compatível com o grupo de idade/divisão.
 */
export function isBeltCompatible(beltName: string, ageGroupName: string): boolean {
    const division = getAgeGroupDivision(ageGroupName);
    const b = beltName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (division === 'Kids') {
        return ["branca", "cinza", "amarela", "laranja", "verde"].some(fb => b.includes(fb));
    }
    if (division === 'Juvenil') {
        return ["branca", "azul", "roxa"].some(fb => b.includes(fb));
    }
    if (division === 'Adulto' || division === 'Master') {
        return ["branca", "azul", "roxa", "marrom", "preta"].some(fb => b.includes(fb));
    }

    return false;
}

/**
 * Retorna as classes de peso oficiais CBJJ (Gi) 2024 para uma divisão e sexo.
 */
export function getCBJJWeightClasses(ageGroupName: string): WeightClass[] {
    const division = getAgeGroupDivision(ageGroupName);
    const n = ageGroupName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const isFemale = n.includes("feminino");

    if (division === 'Adulto' || division === 'Master') {
        return isFemale ? FEMALE_ADULT_WEIGHTS : MALE_ADULT_WEIGHTS;
    }

    if (division === 'Juvenil') {
        return isFemale ? FEMALE_JUVENILE_WEIGHTS : MALE_JUVENILE_WEIGHTS;
    }

    if (division === 'Kids') {
        // Mapear subfaixas específicas para Kids
        if (n.includes("pre-mirim 1")) return KIDS_WEIGHTS_4;
        if (n.includes("pre-mirim 2")) return KIDS_WEIGHTS_5;
        if (n.includes("pre-mirim 3")) return KIDS_WEIGHTS_6;
        if (n.includes("mirim 1")) return KIDS_WEIGHTS_7;
        if (n.includes("mirim 2")) return KIDS_WEIGHTS_8;
        if (n.includes("mirim 3")) return KIDS_WEIGHTS_9;
        if (n.includes("infantil 1")) return KIDS_WEIGHTS_10;
        if (n.includes("infantil 2")) return KIDS_WEIGHTS_11;
        if (n.includes("infantil 3")) return KIDS_WEIGHTS_12;
        if (n.includes("infanto-juvenil 1")) return KIDS_WEIGHTS_13;
        if (n.includes("infanto-juvenil 2")) return KIDS_WEIGHTS_14;
        if (n.includes("infanto-juvenil 3")) return KIDS_WEIGHTS_15;
    }

    return [];
}

/**
 * Determina se a faixa participa do Absoluto Misto (Azul para cima em Adulto/Master).
 */
export function isMixedAbsoluteBelt(beltName: string, ageGroupName: string): boolean {
    const division = getAgeGroupDivision(ageGroupName);
    if (division !== 'Adulto' && division !== 'Master') return false;

    const b = beltName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return ["azul", "roxa", "marrom", "preta"].some(fb => b.includes(fb));
}

// --- TABELAS DE PESO (GI 2024/2025) ---

const MALE_ADULT_WEIGHTS: WeightClass[] = [
    { name: "Galo", min_weight: 0, max_weight: 57.5 },
    { name: "Pluma", min_weight: 57.5, max_weight: 64.0 },
    { name: "Pena", min_weight: 64.0, max_weight: 70.0 },
    { name: "Leve", min_weight: 70.0, max_weight: 76.0 },
    { name: "Médio", min_weight: 76.0, max_weight: 82.3 },
    { name: "Meio-Pesado", min_weight: 82.3, max_weight: 88.3 },
    { name: "Pesado", min_weight: 88.3, max_weight: 94.3 },
    { name: "Super-Pesado", min_weight: 94.3, max_weight: 100.5 },
    { name: "Pesadíssimo", min_weight: 100.5, max_weight: 999 },
];

const FEMALE_ADULT_WEIGHTS: WeightClass[] = [
    { name: "Galo", min_weight: 0, max_weight: 48.5 },
    { name: "Pluma", min_weight: 48.5, max_weight: 53.5 },
    { name: "Pena", min_weight: 53.5, max_weight: 58.5 },
    { name: "Leve", min_weight: 58.5, max_weight: 64.0 },
    { name: "Médio", min_weight: 64.0, max_weight: 69.0 },
    { name: "Meio-Pesado", min_weight: 69.0, max_weight: 74.0 },
    { name: "Pesado", min_weight: 74.0, max_weight: 79.3 },
    { name: "Pesadíssimo", min_weight: 79.3, max_weight: 999 },
];

const MALE_JUVENILE_WEIGHTS: WeightClass[] = [
    { name: "Galo", min_weight: 0, max_weight: 53.5 },
    { name: "Pluma", min_weight: 53.5, max_weight: 58.5 },
    { name: "Pena", min_weight: 58.5, max_weight: 64.0 },
    { name: "Leve", min_weight: 64.0, max_weight: 69.0 },
    { name: "Médio", min_weight: 69.0, max_weight: 74.0 },
    { name: "Meio-Pesado", min_weight: 74.0, max_weight: 79.3 },
    { name: "Pesado", min_weight: 79.3, max_weight: 84.3 },
    { name: "Super-Pesado", min_weight: 84.3, max_weight: 89.3 },
    { name: "Pesadíssimo", min_weight: 89.3, max_weight: 999 },
];

const FEMALE_JUVENILE_WEIGHTS: WeightClass[] = [
    { name: "Galo", min_weight: 0, max_weight: 44.30 },
    { name: "Pluma", min_weight: 44.30, max_weight: 48.30 },
    { name: "Pena", min_weight: 48.30, max_weight: 52.50 },
    { name: "Leve", min_weight: 52.50, max_weight: 56.50 },
    { name: "Médio", min_weight: 56.50, max_weight: 60.50 },
    { name: "Meio-Pesado", min_weight: 60.50, max_weight: 65.00 },
    { name: "Pesado", min_weight: 65.00, max_weight: 69.00 },
    { name: "Pesadíssimo", min_weight: 69.00, max_weight: 999 },
];

// Tabelas Kids (Unificado Masculino/Feminino padrão IBJJF)
const KIDS_WEIGHTS_4 = [
    { name: "Galo", min_weight: 0, max_weight: 15.0 },
    { name: "Pluma", min_weight: 15.0, max_weight: 18.0 },
    { name: "Pena", min_weight: 18.0, max_weight: 21.0 },
    { name: "Leve", min_weight: 21.0, max_weight: 24.0 },
    { name: "Médio", min_weight: 24.0, max_weight: 27.0 },
    { name: "Meio-Pesado", min_weight: 27.0, max_weight: 30.0 },
    { name: "Pesado", min_weight: 30.0, max_weight: 33.0 },
    { name: "Super-Pesado", min_weight: 33.0, max_weight: 36.0 },
    { name: "Pesadíssimo", min_weight: 36.0, max_weight: 999 },
];

const KIDS_WEIGHTS_5 = [
    { name: "Galo", min_weight: 0, max_weight: 16.0 },
    { name: "Pluma", min_weight: 16.0, max_weight: 19.0 },
    { name: "Pena", min_weight: 19.0, max_weight: 22.0 },
    { name: "Leve", min_weight: 22.0, max_weight: 25.0 },
    { name: "Médio", min_weight: 25.0, max_weight: 28.0 },
    { name: "Meio-Pesado", min_weight: 28.0, max_weight: 31.0 },
    { name: "Pesado", min_weight: 31.0, max_weight: 34.0 },
    { name: "Super-Pesado", min_weight: 34.0, max_weight: 37.0 },
    { name: "Pesadíssimo", min_weight: 37.0, max_weight: 999 },
];

const KIDS_WEIGHTS_6 = [
    { name: "Galo", min_weight: 0, max_weight: 17.0 },
    { name: "Pluma", min_weight: 17.0, max_weight: 20.0 },
    { name: "Pena", min_weight: 20.0, max_weight: 23.0 },
    { name: "Leve", min_weight: 23.0, max_weight: 26.0 },
    { name: "Médio", min_weight: 26.0, max_weight: 29.0 },
    { name: "Meio-Pesado", min_weight: 29.0, max_weight: 32.0 },
    { name: "Pesado", min_weight: 32.0, max_weight: 35.0 },
    { name: "Super-Pesado", min_weight: 35.0, max_weight: 38.0 },
    { name: "Pesadíssimo", min_weight: 38.0, max_weight: 999 },
];

const KIDS_WEIGHTS_7 = [
    { name: "Galo", min_weight: 0, max_weight: 20.0 },
    { name: "Pluma", min_weight: 20.0, max_weight: 23.0 },
    { name: "Pena", min_weight: 23.0, max_weight: 26.0 },
    { name: "Leve", min_weight: 26.0, max_weight: 29.0 },
    { name: "Médio", min_weight: 29.0, max_weight: 32.0 },
    { name: "Meio-Pesado", min_weight: 32.0, max_weight: 35.0 },
    { name: "Pesado", min_weight: 35.0, max_weight: 38.0 },
    { name: "Super-Pesado", min_weight: 38.0, max_weight: 41.0 },
    { name: "Pesadíssimo", min_weight: 41.0, max_weight: 999 },
];

const KIDS_WEIGHTS_8 = [
    { name: "Galo", min_weight: 0, max_weight: 21.0 },
    { name: "Pluma", min_weight: 21.0, max_weight: 24.0 },
    { name: "Pena", min_weight: 24.0, max_weight: 27.0 },
    { name: "Leve", min_weight: 27.0, max_weight: 30.0 },
    { name: "Médio", min_weight: 30.0, max_weight: 33.0 },
    { name: "Meio-Pesado", min_weight: 33.0, max_weight: 36.0 },
    { name: "Pesado", min_weight: 36.0, max_weight: 39.0 },
    { name: "Super-Pesado", min_weight: 39.0, max_weight: 42.0 },
    { name: "Pesadíssimo", min_weight: 42.0, max_weight: 999 },
];

const KIDS_WEIGHTS_9 = [
    { name: "Galo", min_weight: 0, max_weight: 23.0 },
    { name: "Pluma", min_weight: 23.0, max_weight: 26.0 },
    { name: "Pena", min_weight: 26.0, max_weight: 29.0 },
    { name: "Leve", min_weight: 29.0, max_weight: 32.0 },
    { name: "Médio", min_weight: 32.0, max_weight: 35.0 },
    { name: "Meio-Pesado", min_weight: 35.0, max_weight: 38.0 },
    { name: "Pesado", min_weight: 38.0, max_weight: 41.0 },
    { name: "Super-Pesado", min_weight: 41.0, max_weight: 44.0 },
    { name: "Pesadíssimo", min_weight: 44.0, max_weight: 999 },
];

const KIDS_WEIGHTS_10 = [
    { name: "Galo", min_weight: 0, max_weight: 25.0 },
    { name: "Pluma", min_weight: 25.0, max_weight: 28.0 },
    { name: "Pena", min_weight: 28.0, max_weight: 31.0 },
    { name: "Leve", min_weight: 31.0, max_weight: 34.0 },
    { name: "Médio", min_weight: 34.0, max_weight: 37.0 },
    { name: "Meio-Pesado", min_weight: 37.0, max_weight: 40.0 },
    { name: "Pesado", min_weight: 40.0, max_weight: 43.0 },
    { name: "Super-Pesado", min_weight: 43.0, max_weight: 46.0 },
    { name: "Pesadíssimo", min_weight: 46.0, max_weight: 999 },
];

const KIDS_WEIGHTS_11 = [
    { name: "Galo", min_weight: 0, max_weight: 28.0 },
    { name: "Pluma", min_weight: 28.0, max_weight: 31.0 },
    { name: "Pena", min_weight: 31.0, max_weight: 34.0 },
    { name: "Leve", min_weight: 34.0, max_weight: 37.0 },
    { name: "Médio", min_weight: 37.0, max_weight: 40.0 },
    { name: "Meio-Pesado", min_weight: 40.0, max_weight: 43.0 },
    { name: "Pesado", min_weight: 43.0, max_weight: 46.0 },
    { name: "Super-Pesado", min_weight: 46.0, max_weight: 49.0 },
    { name: "Pesadíssimo", min_weight: 49.0, max_weight: 999 },
];

const KIDS_WEIGHTS_12 = [
    { name: "Galo", min_weight: 0, max_weight: 31.0 },
    { name: "Pluma", min_weight: 31.0, max_weight: 34.0 },
    { name: "Pena", min_weight: 34.0, max_weight: 37.0 },
    { name: "Leve", min_weight: 37.0, max_weight: 40.0 },
    { name: "Médio", min_weight: 40.0, max_weight: 43.0 },
    { name: "Meio-Pesado", min_weight: 43.0, max_weight: 46.0 },
    { name: "Pesado", min_weight: 46.0, max_weight: 49.0 },
    { name: "Super-Pesado", min_weight: 49.0, max_weight: 52.0 },
    { name: "Pesadíssimo", min_weight: 52.0, max_weight: 999 },
];

const KIDS_WEIGHTS_13 = [
    { name: "Galo", min_weight: 0, max_weight: 35.0 },
    { name: "Pluma", min_weight: 35.0, max_weight: 38.0 },
    { name: "Pena", min_weight: 38.0, max_weight: 41.0 },
    { name: "Leve", min_weight: 41.0, max_weight: 44.0 },
    { name: "Médio", min_weight: 44.0, max_weight: 47.0 },
    { name: "Meio-Pesado", min_weight: 47.0, max_weight: 50.0 },
    { name: "Pesado", min_weight: 50.0, max_weight: 53.0 },
    { name: "Super-Pesado", min_weight: 53.0, max_weight: 56.0 },
    { name: "Pesadíssimo", min_weight: 56.0, max_weight: 999 },
];

const KIDS_WEIGHTS_14 = [
    { name: "Galo", min_weight: 0, max_weight: 38.0 },
    { name: "Pluma", min_weight: 38.0, max_weight: 41.0 },
    { name: "Pena", min_weight: 41.0, max_weight: 44.0 },
    { name: "Leve", min_weight: 44.0, max_weight: 47.0 },
    { name: "Médio", min_weight: 47.0, max_weight: 50.0 },
    { name: "Meio-Pesado", min_weight: 50.0, max_weight: 53.0 },
    { name: "Pesado", min_weight: 53.0, max_weight: 56.0 },
    { name: "Super-Pesado", min_weight: 56.0, max_weight: 59.0 },
    { name: "Pesadíssimo", min_weight: 59.0, max_weight: 999 },
];

const KIDS_WEIGHTS_15 = [
    { name: "Galo", min_weight: 0, max_weight: 41.0 },
    { name: "Pluma", min_weight: 41.0, max_weight: 44.0 },
    { name: "Pena", min_weight: 44.0, max_weight: 47.0 },
    { name: "Leve", min_weight: 47.0, max_weight: 50.0 },
    { name: "Médio", min_weight: 50.0, max_weight: 53.0 },
    { name: "Meio-Pesado", min_weight: 53.0, max_weight: 56.0 },
    { name: "Pesado", min_weight: 56.0, max_weight: 59.0 },
    { name: "Super-Pesado", min_weight: 59.0, max_weight: 62.0 },
    { name: "Pesadíssimo", min_weight: 62.0, max_weight: 999 },
];
