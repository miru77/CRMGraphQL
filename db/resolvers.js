const Vendedor = require('../models/Vendedor');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

const crearToken = (vendedor, secreta, expiresIn) => {
   // console.log(vendedor);
    const {id, email, nombre, apellido} = vendedor;

    return jwt.sign({id, email, nombre, apellido}, secreta, {expiresIn});

}

//Resolvers
const resolvers = {
    Query: {
            obtenerVendedor: async (_, {}, ctx) => {
                return ctx.usuario;
        },
        
            obtenerProductos: async () => {
                try {
                    const productos = await Producto.find({}).sort({creado: -1});
                    return productos
                } catch (error) {
                    console.log(error)
                }
            
        },
            obtenerProducto: async (_, {id}) => {
                //REvisar si existe el producto
                const producto = await Producto.findById(id);

                if(!producto) {
                    throw new Error('Producto no encontrado');
                }
                return producto;
        },
        obtenerClientes:  async () => {
            try {
                const clientes = await Cliente.find({});
                return clientes
            } catch (error) {
                console.log(error)
            }
        },
        obtenerClientesVendedor:  async (_, {}, ctx) => {
            try {
                const clientes = await Cliente.find({vendedor: ctx.usuario.id.toString()}).sort({creado: -1});
                return clientes
            } catch (error) {
                console.log(error)
            }
        
        },
        obtenerCliente: async (_,{id}, ctx) => {
            //REvisar si el cliente existe o no
            const cliente = await Cliente.findById(id);
            if(!cliente) {
                throw new Error('Cliente no encontrado');
            }

            //quien lo cfreo puedo verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            return cliente;

        },
        obtenerPedidos:  async () => {
            try {
                const pedidos = await Pedido.find({});
                return pedidos
            } catch (error) {
                console.log(error)
            }
        },
        obtenerPedidosVendedor:  async (_, {}, ctx) => {
            try {
                const pedidos = await Pedido.find({vendedor: ctx.usuario.id.toString()}).populate('cliente');
                console.log(pedidos);
                return pedidos
            } catch (error) {
                console.log(error)
            }
        
        },
        obtenerPedido: async (_,{id}, ctx) => {
            //REvisar si el pedido existe o no
            const pedido = await Pedido.findById(id);
            if(!pedido) {
                throw new Error('Pedido no encontrado');
            }

            //quien lo cfreo puedo verlo
            if(pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            return pedido;

        },
        ontenerPedidoEstado: async (_,{estado}, ctx) => {
            //REvisar si el pedido existe o no
            const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado });
         
            return pedidos;

        },
        mejoresClientes: async () => {
            const clientes = await Pedido.aggregate([
                { $match : {estado : "COMPLETADO"}},
                { $group : {
                    _id : "$cliente",
                    total: {$sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: "_id",
                        as: "cliente"
                    }
                },
                {
                    $limit: 10
                },
                {
                    $sort : {total : -1 }
                }

            ]);
            return clientes;
        },
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                { $match : {estado : "COMPLETADO"}},
                { $group : {
                    _id : "$vendedor",
                    total: {$sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'vendedors',
                        localField: '_id',
                        foreignField: "_id",
                        as: "vendedor"
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort : {total : -1 }
                }
            ]);
                return vendedores;
        },
        buscarProducto: async(_, {texto}) => {
            const productos = await Producto.find({$text: {$search: texto}}).limit(10)

            return productos;
        }
    }, 

    Mutation: {
        nuevoVendedor: async (_, {input}) => {

            const {email, password } = input;
          //REvisar si el usuario ya esta registrado
            const existeVendedor = await Vendedor.findOne({email});
            
            if (existeVendedor) {
                throw new Error('EL Vendedor ya esta registrado');
            }
          //hashear su password
          const salt = await bcryptjs.genSalt(10);
          input.password = await bcryptjs.hash(password, salt);

          try {
        //guardarlo en la base de datos
            const vendedor = new Vendedor(input);
            vendedor.save();  //guardarlo
            return vendedor;
          } catch (error) {
              console.log(error);
              
          }
        },
        autenticarVendedor:  async (_, {input}) => {

            const {email, password } = input;
            //REvisar si el usuario ya esta registrado
              const existeVendedor = await Vendedor.findOne({email});
              if (!existeVendedor) {
                throw new Error('EL Vendedor no existe');
            }
            //REvisar si el password es correcto
            const passwordCorrecto = await bcryptjs.compare(password, existeVendedor.password);
            if (!passwordCorrecto) {
                throw new Error('EL Password es incorrecto');
            }
            //Crear el token
            return{
                token: crearToken(existeVendedor, process.env.SECRETA, '72h')
            }
        },
        nuevoProducto:  async (_, {input}) => {
            try {
                const producto = new Producto(input);

                //almacenar en la BD
                const resultado = await producto.save();
                return resultado
            } catch (error) {
                console.log(error);
                
            }
        },
        actualizarProducto:  async (_, {id, input}) => {

             //REvisar si existe el producto
             let producto = await Producto.findById(id);

             if(!producto) {
                 throw new Error('Producto no encontrado');
             }
             //guardar en la base de datos
             producto = await Producto.findOneAndUpdate({_id : id}, input, {new: true});
             return producto;

        },
        eliminarProducto:  async (_, {id}) => {
             //REvisar si existe el producto
             let producto = await Producto.findById(id);

             if(!producto) {
                 throw new Error('Producto no encontrado');
             }
             //elimiar en la base de datos
            await Producto.findOneAndDelete({_id : id});
             return "Producto Eliminado";
        },
        nuevoCliente:  async (_, {input}, ctx) => {
            //console.log(ctx);
            // verificar si el cliente ya esta

            const {email} = input;
            const cliente = await Cliente.findOne({email});
            if(cliente){
                throw new Error('El cliente ta fue registrado');
            }
            const nuevoCli = new Cliente(input);
            //asignar vendedor
            nuevoCli.vendedor = ctx.usuario.id;
            //guardar en la base de datos
            try {
               
                const resultado = await nuevoCli.save();
                return resultado;
                
            } catch (error) {
                console.log(error);
            }
            

        },
        actualizarCliente:  async (_, {id, input}, ctx) => { 

            //REvisar si el cliente existe o no
            let cliente = await Cliente.findById(id);
            if(!cliente) {
                throw new Error('Cliente no encontrado');
            }

            //quien lo cfreo puedo verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            cliente = await Cliente.findOneAndUpdate({_id: id}, input, {new: true});
            return cliente;

        },
        eliminarCliente:  async (_, {id}, ctx) => { 

            //REvisar si el cliente existe o no
            let cliente = await Cliente.findById(id);
            if(!cliente) {
                throw new Error('Cliente no encontrado');
            }

            //quien lo cfreo puedo verlo
            if(cliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            //Eliminar CLiente
            await Cliente.findOneAndDelete({_id: id});
          return "Cliente Eliminado"
        },
        nuevoPedido: async (_, {input}, ctx) => {

            const {cliente} = input;
            //verificar si el cliente existe o no
            let clienteExiste = await Cliente.findById(cliente);
            if(!clienteExiste) {
                throw new Error('Cliente no encontrado');
            }
            //verificar si el cliente pertence a este vendedor
            if(clienteExiste.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }

            //REvisar que el stock este disponible
                for await (const articulo of input.pedido) {
                    const {id} = articulo;
                    const producto = await Producto.findById(id);

                    if(articulo.cantidad > producto.existencia) {
                        throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                    }else {
                        //Restar la cantidad a lo disponible
                        producto.existencia = producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                }
                
                // crear un pedido
                const nuevoPed = new Pedido(input);
                //asignarle un vendedor
                nuevoPed.vendedor = ctx.usuario.id;
                //grabar en la base de datos
                const resultado = await nuevoPed.save();
                return resultado;
        },
         actualizarPedido:  async (_, {id, input}, ctx) => { 

             const {cliente} = input;

                //REvisar si el pedido existe o no
            const existepedido = await Pedido.findById(id);
            if(!existepedido) {
                throw new Error('Pedido no encontrado');
            }
            // si el cliente existe
            const existecliente = await Cliente.findById(cliente);
            if(!existecliente) {
                throw new Error('Cliente no encontrado');
            }
            //quien lo cfreo puedo verlo
            if(existecliente.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
             //REvisar que el stock este disponible
             if(input.pedido) {
                for await (const articulo of input.pedido) {
                    const {id} = articulo;
                    const producto = await Producto.findById(id);
    
                    if(articulo.cantidad > producto.existencia) {
                        throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                    }else {
                        //Restar la cantidad a lo disponible
                        producto.existencia = producto.existencia - articulo.cantidad;
                        await producto.save();
                    }
                }
             }
           
            //guardar el pedido
            const resultado = await Pedido.findOneAndUpdate({_id: id}, input, {new: true});
            return resultado;
        },
        elimiarPedido:  async (_, {id}, ctx) => { 

             //REvisar si el pedido existe o no
             const existepedido = await Pedido.findById(id);
             if(!existepedido) {
                 throw new Error('Pedido no encontrado');
             }
            //quien lo cfreo puedo verlo
            if(existepedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error('No tienes las credenciales');
            }
            //Eliminar CLiente
            await Pedido.findOneAndDelete({_id: id});
          return "Pedido Eliminado"
        }

    }
}

module.exports = resolvers;