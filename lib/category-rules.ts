export type BeltType = 'infantil' | 'adulto' | 'unknown';

export interface AgeGroupContext {
    isChild: boolean;
    isJuvenile: boolean;
    isAdult: boolean;
    isMaster: boolean;
    isAbsolute: boolean;
}

export function getBeltType(beltName: string): BeltType {
    const name = beltName.toLowerCase();
    if (["cinza", "amarela", "laranja", "verde"].some(k => name.includes(k))) return 'infantil';
    if (["branca", "azul", "roxa", "marrom", "preta"].some(k => name.includes(k))) return 'adulto';
    return 'unknown';
}

export function getAgeGroupContext(ageGroupName: string): AgeGroupContext {
    const name = ageGroupName.toLowerCase();
    return {
        isChild: ["infantil", "infanto-juvenil"].some(k => name.includes(k)),
        isJuvenile: name.includes("juvenil") && !name.includes("infanto"),
        isAdult: name.includes("adulto"),
        isMaster: name.includes("master"),
        isAbsolute: name.includes("absoluto")
    };
}

export function isCompatible(beltName: string, ageGroupName: string): { compatible: boolean; error?: string } {
    const beltType = getBeltType(beltName);
    const ctx = getAgeGroupContext(ageGroupName);

    if (beltType === 'infantil') {
        if (!ctx.isChild) {
            return { compatible: false, error: "Faixas infantis permitem apenas categorias Infantil ou Infanto-Juvenil." };
        }
    } else if (beltType === 'adulto') {
        if (ctx.isChild) {
            return { compatible: false, error: "Faixas adultas não permitem categorias infantis." };
        }
        if (ctx.isAbsolute) {
            if (ctx.isMaster || ctx.isJuvenile) {
                return { compatible: false, error: "Absoluto permitido apenas para categorias Adulto Feminino/Masculino." };
            }
        }
    }

    return { compatible: true };
}

export const CATEGORY_RULES_DESCRIPTION = [
    {
        title: "Faixas Infantis (Cinza, Amarela, Laranja, Verde)",
        allowed: ["Infantil Feminino / Masculino", "Infanto-Juvenil Feminino / Masculino"],
        blocked: ["Juvenil", "Adulto", "Master", "Absoluto"]
    },
    {
        title: "Faixas Adultas (Branca, Azul, Roxa, Marrom, Preta)",
        allowed: ["Juvenil Feminino / Masculino", "Adulto Feminino / Masculino", "Master Feminino / Masculino"],
        blocked: ["Infantil", "Infanto-Juvenil"]
    },
    {
        title: "Absoluto (Regra Especial)",
        allowed: ["Faixas Adultas", "Categoria Adulto Feminino/Masculino"],
        blocked: ["Qualquer faixa infantil", "Categorias Infantil, Infanto-Juvenil, Juvenil ou Master"]
    }
];
