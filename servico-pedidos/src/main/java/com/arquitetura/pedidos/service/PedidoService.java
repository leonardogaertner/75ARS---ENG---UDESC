package com.arquitetura.pedidos.service;

import com.arquitetura.pedidos.model.Pedido;
import com.arquitetura.pedidos.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final RestTemplate restTemplate;

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public Optional<Pedido> buscarPorId(Long id) {
        return pedidoRepository.findById(id);
    }

    public List<Pedido> buscarPorCliente(Long clienteId) {
        return pedidoRepository.findByClienteId(clienteId);
    }

    public List<Pedido> buscarPorProduto(Long idProduto) {
        return pedidoRepository.findByIdProduto(idProduto);
    }

    public Pedido salvar(Pedido pedido) {
        validarCliente(pedido.getCliente());
        validarProduto(pedido.getIdProduto());

        return pedidoRepository.save(pedido);
    }

    private void validarCliente(Object clienteId) {
        try {
            // Usar o API Gateway em vez de conectar direto ao serviço
            String urlCliente = "http://api-gateway:8080/api/clientes/" + clienteId;
            ResponseEntity<String> response = restTemplate.getForEntity(urlCliente, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Cliente inválido ou não encontrado no Serviço de Clientes");
            }
        } catch (HttpClientErrorException.NotFound e) {
            throw new RuntimeException("Falha na comunicação: Cliente não existe.");
        } catch (Exception e) {
            throw new RuntimeException("Serviço de Clientes indisponível no momento.");
        }
    }

    private void validarProduto(Object produtoId) {
        try {
            String urlProduto = "http://servico-produtos:8081/produtos/" + produtoId;
            ResponseEntity<String> response = restTemplate.getForEntity(urlProduto, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Produto inválido ou não encontrado no Serviço de Produtos");
            }
        } catch (HttpClientErrorException.NotFound e) {
            throw new RuntimeException("Falha na comunicação: Produto não existe.");
        } catch (Exception e) {
            throw new RuntimeException("Serviço de Produtos indisponível no momento.");
        }
    }

    public Pedido atualizar(Long id, Pedido pedidoAtualizado) {
        return pedidoRepository.findById(id).map(pedido -> {
            pedido.setCliente(pedidoAtualizado.getCliente());
            pedido.setIdProduto(pedidoAtualizado.getIdProduto());
            pedido.setQuantidade(pedidoAtualizado.getQuantidade());
            pedido.setValorTotal(pedidoAtualizado.getValorTotal());
            pedido.setStatus(pedidoAtualizado.getStatus());
            return pedidoRepository.save(pedido);
        }).orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
    }

    public void deletar(Long id) {
        pedidoRepository.deleteById(id);
    }
}
