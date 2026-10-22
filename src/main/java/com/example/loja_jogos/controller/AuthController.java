package com.example.loja_jogos.controller;

import com.example.loja_jogos.model.Usuario;
import com.example.loja_jogos.repository.UsuarioJsonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UsuarioJsonRepository usuarios;

    public AuthController(UsuarioJsonRepository usuarios) {
        this.usuarios = usuarios;
    }

    @PostMapping("/registro")
    public Usuario registrar(@RequestBody Usuario dados) {
        if (vazio(dados.getNome()) || vazio(dados.getEmail()) || vazio(dados.getSenha())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Preencha nome, email e senha");
        }
        if (usuarios.buscarPorEmail(dados.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }
        return semSenha(usuarios.salvar(dados));
    }

    @PostMapping("/login")
    public Usuario login(@RequestBody Usuario dados) {
        Usuario u = usuarios.buscarPorEmail(dados.getEmail()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou senha inválidos"));
        if (!u.getSenha().equals(dados.getSenha())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email ou senha inválidos");
        }
        return semSenha(u);
    }

    private boolean vazio(String texto) {
        return texto == null || texto.isBlank();
    }

    private Usuario semSenha(Usuario u) {
        Usuario copia = new Usuario();
        copia.setId(u.getId());
        copia.setNome(u.getNome());
        copia.setEmail(u.getEmail());
        return copia;
    }
}