// Guarda o estado da loja (filtros, quantos painéis já carregaram e a posição da rolagem)
// para que o botão "voltar" do navegador devolva o usuário exatamente onde ele estava,
// como a Steam faz. Fica fora do React de propósito: sobrevive à troca de página.
const vazio = () => ({ valido: false, busca: '', genero: 'Todos', ordem: 'feed', paineis: 0, visiveis: 0, scrollY: 0 });

let memoria = vazio();

export const storeMemory = {
    get: () => memoria,
    patch: (parcial) => {
        memoria = { ...memoria, ...parcial, valido: true };
    },
    reset: () => {
        memoria = vazio();
    },
};
