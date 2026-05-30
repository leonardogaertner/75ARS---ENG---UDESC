package com.arquitetura.pedidos.service;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.arquitetura.pedidos.model.Pedido;
import com.arquitetura.pedidos.repository.PedidoRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final RestTemplate restTemplate;

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public Optional<Pedido> buscarPorId(@NonNull Long id) {
        return pedidoRepository.findById(id);
    }

    public List<Pedido> buscarPorCliente(Long clienteId) {
        return pedidoRepository.findByClienteId(clienteId);
    }

    public List<Pedido> buscarPorProduto(Long idProduto) {
        return pedidoRepository.findByIdProduto(idProduto);
    }

    public Pedido salvar(Pedido pedido) {
        validarCliente(pedido.getClienteId());
        validarProduto(pedido.getIdProduto());

        return pedidoRepository.save(pedido);
    }

    private void validarCliente(Long clienteId) {
        try {
            // Comunicação direta com o Serviço de Clientes (sem passar pelo API Gateway)
            String urlCliente = "http://servico-clientes:3000/" + clienteId;
            ResponseEntity<String> response = restTemplate.getForEntity(urlCliente, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente inválido ou não encontrado no Serviço de Clientes");
            }
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falha na comunicação: Cliente não existe.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Serviço de Clientes indisponível no momento.");
        }
    }

    private void validarProduto(Long produtoId) {
        try {
            String urlProduto = "http://servico-produtos:8081/produtos/" + produtoId;
            ResponseEntity<String> response = restTemplate.getForEntity(urlProduto, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto inválido ou não encontrado no Serviço de Produtos");
            }
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Falha na comunicação: Produto não existe.");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Serviço de Produtos indisponível no momento.");
        }
    }

    public Pedido atualizar(@NonNull Long id, Pedido pedidoAtualizado) {
        return pedidoRepository.findById(id).map(pedido -> {
            pedido.setClienteId(pedidoAtualizado.getClienteId());
            pedido.setIdProduto(pedidoAtualizado.getIdProduto());
            pedido.setQuantidade(pedidoAtualizado.getQuantidade());
            pedido.setValorTotal(pedidoAtualizado.getValorTotal());
            pedido.setStatus(pedidoAtualizado.getStatus());
            return pedidoRepository.save(pedido);
        }).orElseThrow(() -> new RuntimeException("Pedido não encontrado"));
    }

    public void deletar(@NonNull Long id) {
        pedidoRepository.deleteById(id);
    }
}
