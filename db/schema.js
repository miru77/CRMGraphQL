const { gql} = require('apollo-server');

//Schema
const typeDefs = gql`

    type Vendedor {
        id: ID
        nombre: String
        apellido: String
        email: String
        creado: String
    }
        type Token {
            token: String      
    }
    type Producto {
        id: ID
        nombre:  String
        existencia: Int
        precio: Float
        creado:  String
    }
    type Cliente {
        id: ID
        nombre: String
        apellido: String
        empresa: String
        email: String
        telefono: String
        vendedor: ID
    
    }
    type PedidoGrupo {
        id: ID
        cantidad: Int
        nombre: String
        precio: Float
    }
    type Pedido {
        id: ID
        pedido: [PedidoGrupo]
        total: Float
        cliente: Cliente
        vendedor: ID
        fecha: String
        estado: EstadoPedido
    }
    type TopCliente {
        total: Float
        cliente: [Cliente]   
    }
    type TopVendedor {
        total : Float
        vendedor : [Vendedor]
    }
    input VendedorInput {
        nombre: String!
        apellido: String!
        email: String!
        password: String!
    }
    input AutenticarInput {
        email: String!
        password: String!
    }
    input ProductoInput {
        nombre:  String!
        existencia: Int!
        precio: Float!
    }
    input ClienteInput {
        nombre: String!
        apellido: String!
        empresa: String!
        email: String!
        telefono: String
    }
    input PedidoProductoInput {
        id: ID
        cantidad: Int
        nombre: String
        precio: Float
    }
    input PedidoInput {
        pedido: [PedidoProductoInput]
        total: Float
        cliente: ID
        estado: EstadoPedido

    }
    enum EstadoPedido {
        PENDIENTE
        COMPLETADO
        CANCELADO
    }

    type Query {
            # Vendedores
            obtenerVendedor: Vendedor

            # Productos
            obtenerProductos: [Producto]
            obtenerProducto(id:ID!) : Producto

            # Clientes
            obtenerClientes: [Cliente]
            obtenerClientesVendedor: [Cliente]
            obtenerCliente(id: ID!): Cliente

            # Pedidos
            obtenerPedidos: [Pedido]
            obtenerPedidosVendedor: [Pedido]
            obtenerPedido(id: ID!) : Pedido
            ontenerPedidoEstado(estado: String!): [Pedido]

            # Busqueda Avanzada
            mejoresClientes: [TopCliente]
            mejoresVendedores: [TopVendedor]
            buscarProducto(texto: String!) : [Producto]

    }
    type Mutation {
        # Vendedores
        nuevoVendedor(input: VendedorInput) : Vendedor
        autenticarVendedor(input: AutenticarInput): Token

        # Productos
        nuevoProducto(input: ProductoInput) : Producto
        actualizarProducto(id:ID!, input: ProductoInput) : Producto
        eliminarProducto(id:ID!) : String

        #Clentes
        nuevoCliente(input: ClienteInput) : Cliente
        actualizarCliente(id:ID!, input: ClienteInput) : Cliente
        eliminarCliente(id:ID!) : String

        # Pedidos
        nuevoPedido(input: PedidoInput) : Pedido
        actualizarPedido(id: ID!, input: PedidoInput) : Pedido
        elimiarPedido(id: ID!) : String


    }
`;

module.exports = typeDefs;