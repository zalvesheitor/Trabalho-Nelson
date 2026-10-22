package com.example.loja_jogos.model;

public class Jogo {
    private Long id;
    private String slug;
    private String titulo;
    private String genero;
    private Double preco;
    private String classificacao;
    private String desenvolvedora;
    private String lancamento;
    private Boolean destaque;
    private String sinopse;
    private String capa;
    private String banner;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }

    public Double getPreco() { return preco; }
    public void setPreco(Double preco) { this.preco = preco; }

    public String getClassificacao() { return classificacao; }
    public void setClassificacao(String classificacao) { this.classificacao = classificacao; }

    public String getDesenvolvedora() { return desenvolvedora; }
    public void setDesenvolvedora(String desenvolvedora) { this.desenvolvedora = desenvolvedora; }

    public String getLancamento() { return lancamento; }
    public void setLancamento(String lancamento) { this.lancamento = lancamento; }

    public Boolean getDestaque() { return destaque; }
    public void setDestaque(Boolean destaque) { this.destaque = destaque; }

    public String getSinopse() { return sinopse; }
    public void setSinopse(String sinopse) { this.sinopse = sinopse; }

    public String getCapa() { return capa; }
    public void setCapa(String capa) { this.capa = capa; }

    public String getBanner() { return banner; }
    public void setBanner(String banner) { this.banner = banner; }
}