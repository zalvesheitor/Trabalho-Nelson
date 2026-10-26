package com.example.loja_jogos.model;

// Um jogo adquirido por um usuário. A avaliação (nota/texto) fica junto, pois só quem possui o jogo avalia.
public class Aquisicao {
    private Long usuarioId;
    private int jogoId;
    private String data;
    private Integer nota;
    private String texto;
    private String dataAvaliacao;

    public Aquisicao() {}

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public int getJogoId() { return jogoId; }
    public void setJogoId(int jogoId) { this.jogoId = jogoId; }

    public String getData() { return data; }
    public void setData(String data) { this.data = data; }

    public Integer getNota() { return nota; }
    public void setNota(Integer nota) { this.nota = nota; }

    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }

    public String getDataAvaliacao() { return dataAvaliacao; }
    public void setDataAvaliacao(String dataAvaliacao) { this.dataAvaliacao = dataAvaliacao; }
}