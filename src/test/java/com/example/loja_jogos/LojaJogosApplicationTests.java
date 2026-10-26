package com.example.loja_jogos;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;


@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:testdb")
class LojaJogosApplicationTests {

	@Test
	void contextLoads() {
	}

}
