package com.example.loja_jogos.repository;

import com.example.loja_jogos.model.Usuario;
import org.springframework.stereotype.Repository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class UsuarioJsonRepository {

    private final File arquivo = new File("data/usuarios.json");
    private final ObjectMapper mapper = JsonMapper.builder().build();

    public synchronized List<Usuario> listar() {
        if (!arquivo.exists()) {
            return new ArrayList<>();
        }
        return mapper.readValue(arquivo, new TypeReference<List<Usuario>>() {});
    }

    public synchronized Optional<Usuario> buscarPorEmail(String email) {
        return listar().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                .findFirst();
    }

    public synchronized Optional<Usuario> buscarPorId(Long id) {
        return listar().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst();
    }

    public synchronized Usuario salvar(Usuario novo) {
        List<Usuario> lista = listar();
        long proximoId = lista.stream().mapToLong(Usuario::getId).max().orElse(0) + 1;
        novo.setId(proximoId);
        lista.add(novo);
        arquivo.getParentFile().mkdirs();
        mapper.writerWithDefaultPrettyPrinter().writeValue(arquivo, lista);
        return novo;
    }
}