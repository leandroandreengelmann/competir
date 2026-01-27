/**
 * Utilitários para Sistema de Chaveamento (Brackets)
 */

/**
 * Retorna a próxima potência de 2 maior ou igual a n
 */
export function nextPowerOfTwo(n: number): number {
    if (n <= 2) return 2;
    return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Migra slots de um tamanho antigo para um novo
 * Regra: novoSlot = (slotAntigo * 2) - 1
 */
export function migrateSlots(oldSlots: number[], oldSize: number, newSize: number): Record<number, number> {
    const migration: Record<number, number> = {};

    // Se o tamanho dobrou, aplica a regra (s * 2) - 1
    // Nota: Se dobrar múltiplas vezes, a regra deve ser aplicada recursivamente
    // Mas no nosso fluxo, dobramos de 4->8, 8->16, etc. um por um.

    let currentOldSize = oldSize;
    let currentMigration: Record<number, number> = {};

    // Inicializa migration com os slots originais
    oldSlots.forEach(s => { currentMigration[s] = s; });

    while (currentOldSize < newSize) {
        const nextSize = currentOldSize * 2;
        const tempMigration: Record<number, number> = {};

        for (const oldS in currentMigration) {
            const currentS = currentMigration[oldS];
            tempMigration[oldS] = (currentS * 2) - 1;
        }

        currentMigration = tempMigration;
        currentOldSize = nextSize;
    }

    return currentMigration;
}

/**
 * Encontra o próximo slot disponível em um bracket
 * Prioriza o menor slot disponível.
 */
export function findNextAvailableSlot(existingSlots: number[], bracketSize: number): number | null {
    for (let i = 1; i <= bracketSize; i++) {
        if (!existingSlots.includes(i)) {
            return i;
        }
    }
    return null;
}

/**
 * Repara registrations com bracket_slot NULL atribuindo slots sequenciais
 * Retorna array de { id, newSlot } para persistência
 * @param registrations - Array de registrations com id, bracket_slot, created_at
 * @param bracketSize - Tamanho atual do bracket
 * @returns { repairs: {id, newSlot}[], finalSlots: number[], newBracketSize: number }
 */
export function repairNullSlots(
    registrations: { id: string; bracket_slot: number | null; created_at: string }[],
    bracketSize: number
): { repairs: { id: string; newSlot: number }[]; finalSlots: number[]; newBracketSize: number } {
    // Ordenar por created_at para determinismo
    const sorted = [...registrations].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const repairs: { id: string; newSlot: number }[] = [];
    const occupiedSlots: Set<number> = new Set();
    let currentSize = bracketSize || 4;

    // Primeiro passo: coletar slots já ocupados (não-NULL)
    for (const reg of sorted) {
        if (reg.bracket_slot !== null) {
            occupiedSlots.add(reg.bracket_slot);
        }
    }

    // Segundo passo: atribuir slots aos NULLs
    for (const reg of sorted) {
        if (reg.bracket_slot === null) {
            // Encontrar próximo slot disponível
            let nextSlot = findNextAvailableSlot([...occupiedSlots], currentSize);

            // Se não há slot, dobrar o bracket e migrar slots existentes
            if (nextSlot === null) {
                const newSize = currentSize * 2;
                const newOccupied: Set<number> = new Set();

                // Migrar slots existentes: novoSlot = (slotAntigo * 2) - 1
                for (const oldSlot of occupiedSlots) {
                    const migratedSlot = (oldSlot * 2) - 1;
                    newOccupied.add(migratedSlot);
                }

                // Atualizar repairs já feitos com migração
                for (const repair of repairs) {
                    repair.newSlot = (repair.newSlot * 2) - 1;
                }

                occupiedSlots.clear();
                for (const s of newOccupied) occupiedSlots.add(s);

                currentSize = newSize;
                nextSlot = findNextAvailableSlot([...occupiedSlots], currentSize);
            }

            if (nextSlot !== null) {
                repairs.push({ id: reg.id, newSlot: nextSlot });
                occupiedSlots.add(nextSlot);
            }
        }
    }

    return {
        repairs,
        finalSlots: [...occupiedSlots],
        newBracketSize: currentSize
    };
}
