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
    // Validação desativada a pedido do usuário para permitir maior flexibilidade
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
