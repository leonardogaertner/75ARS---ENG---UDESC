package com.arquitetura.produtos.service;

import java.util.List;
import java.util.Optional;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.arquitetura.produtos.model.Produto;
import com.arquitetura.produtos.repository.ProdutoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final RestTemplate restTemplate;

    public List<Produto> listarTodos() {
        return produtoRepository.findAll();
    }

    public Optional<Produto> buscarPorId(@NonNull Long id) {
        return produtoRepository.findById(id);
    }

    public Produto salvar(@NonNull Produto produto) {
        return produtoRepository.save(produto);
    }

    public Produto atualizar(@NonNull Long id, Produto produtoAtualizado) {
        return produtoRepository.findById(id).map(produto -> {
            produto.setNome(produtoAtualizado.getNome());
            produto.setPreco(produtoAtualizado.getPreco());
            return produtoRepository.save(produto);
        }).orElseThrow(() -> new RuntimeException("Produto não encontrado"));
    }

    public void deletar(@NonNull Long id) {
        validarProdutoSemPedidos(id);
        produtoRepository.deleteById(id);
    }

    private void validarProdutoSemPedidos(Long idProduto) {
        try {
            String url = "http://servico-pedidos:8082/pedidos/produto/" + idProduto;
            Object[] pedidos = restTemplate.getForObject(url, Object[].class);

            if (pedidos != null && pedidos.length > 0) {
                throw new RuntimeException("Não é possível deletar produto com pedidos referenciando-o.");
            }
        } catch (RuntimeException e) {
            if (e.getMessage().contains("pedidos referenciando")) {
                throw e;
            }
            throw new RuntimeException("Serviço de Pedidos indisponível no momento.");
        } catch (Exception e) {
            throw new RuntimeException("Serviço de Pedidos indisponível no momento.");
        }
    }
}
