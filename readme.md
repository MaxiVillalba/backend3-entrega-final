# backend3-entrega-final
Entrega final de backend III


🚀 Sobre esta API - BE3SHOP
Esta es una API RESTful desarrollada con Node.js y Express.js, diseñada para funcionar como el backend principal de una aplicación de e-commerce (be3shop). 

Su propósito es gestionar las operaciones de una tienda online, proveyendo endpoints para la administración de productos, usuarios, carritos de compra y órdenes. Utiliza MongoDB como base de datos para una persistencia de datos eficiente y flexible.

La API está completamente contenerizada con Docker para asegurar un despliegue consistente en cualquier entorno, y está preparada para ser orquestada con Kubernetes (demostrado con Minikube) utilizando Secrets para la gestión segura de variables de entorno.

Tecnologías Clave:
Node.js & Express.js: Plataforma y framework para el desarrollo del servidor.
MongoDB & Mongoose: Base de datos NoSQL y ODM para interacción con la DB.
Docker: Contenerización de la aplicación.
Kubernetes (Minikube): Orquestación y gestión de contenedores.

✨ Requisitos Previos
Es necesario tener instalados:
Git
Docker Desktop
Minikube
Kubectl

🐳 Ejecución y Despliegue
powershell
git clone https://github.com/MaxiVillalba/backend3-entrega-final.git
cd entrega-final


Ejecutar la aplicación con docker
La imagen de docker para esta app está disponible en docker hub en el siguiente link:
https://hub.docker.com/r/massevillalba/entregafinalbe3

Para ejecutar la app, solo se necesita descargar la imagen y luego ejecutarla, especificando la conexion a mongodb
docker pull massevillalba/entregafinalbe3:latest

Ejecutar el contenedor de la aplicación
docker run -p 8000:8000 -d --name be3shop-app -e MONGO_URL="mongodb://host.docker.internal:27017/be3shop" massevillalba/entregafinalbe3:latest

Acceso a la app
http://localhost:8000

Despliegue en minikube
a. Iniciar minikube
minikube start --driver=docker

b. configurar el entorno de docker de minikube
minikube docker-env | Invoke-Expression 

c. aplicar manifiestos de kubernetes
cd k8s/
kubectl apply -f .

d. verificar el despliegue
kubectl get all
kubectl get pvc

e. acceder a la app en minikube
cd ..
minikube service be3shop-service --url