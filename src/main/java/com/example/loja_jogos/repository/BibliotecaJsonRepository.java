package com.example.loja_jogos.repository;

import com.example.loja_jogos.model.Aquisicao;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

// Persiste aquisições e avaliações em data/biblioteca.json (sobrevive ao reinício do servidor).
@Repository
public class BibliotecaJsonRepository {

    private final File arquivo = new File("data/biblioteca.json");
    private final ObjectMapper mapper = JsonMapper.builder().build();

    public synchronized List<Aquisicao> listar() {
        if (!arquivo.exists()) {
            return new ArrayList<>();
        }
        return mapper.readValue(arquivo, new TypeReference<List<Aquisicao>>() {});
    }

    public synchronized void salvarTodos(List<Aquisicao> lista) {
        arquivo.getParentFile().mkdirs();
        mapper.writerWithDefaultPrettyPrinter().writeValue(arquivo, lista);
    }
}