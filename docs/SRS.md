# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document outlines the Software Requirements Specification (SRS) for an e-commerce platform leveraging a microservice architecture to provide catalog browsing, cart management, order placement, and user management.

### 1.2 Scope

The platform enables users to:

- Browse a catalog of products
- Add products to a shopping cart
- Place orders, which update stock and send email notifications
- Support both anonymous and authenticated users for cart and order flows

Only authenticated users can place orders. The cart holds reserved stock for a limited time; if an order isn't placed within this period, the cart is cleared and stock is restored.

### 1.3 Definitions, Acronyms, and Abbreviations

- **API**: Application Programming Interface
- **ERD**: Entity Relationship Diagram

## 2. Overall Description

### 2.1 Product Perspective

The system is developed using microservice architecture for scalability and maintainability. Each business domain (auth, catalog, inventory, cart, order, email) is represented as a distinct service.

### 2.2 Product Functions

- Provide public access to the product catalog
- Allow product addition to shopping carts
- Cart items expire after 10-15 minutes and stock is reset
- Permit authenticated users to place orders
- Send order confirmation via email
- Maintain user accounts and profiles

### 2.3 Operating Environment

- Node.js for service backend
- PostgreSQL for data persistence
- Redis for caching and cart management
- Kong as API gateway for external/internal routing
- RabbitMQ for asynchronous communication
- Keycloak for authentication and authorization

### 2.4 Design and Implementation Constraints

- Must use microservice patterns
- Employs message queues for inter-service communication
- Secure endpoints using OAuth2 via Keycloak

### 2.5 User Classes and Characteristics

- **Anonymous Users**: Can browse products and add to cart
- **Authenticated Users**: Can place orders and manage their profiles
- **Administrators**: Manage products, monitor stocks, view logs

### 2.6 Assumptions and Dependencies

- Users have internet access
- System will be containerized (Docker)
- Third-party services (SMTP) are available for email

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 Catalog

- Display all products
- View product details with current stock

#### 3.1.2 Cart

- Add/remove products to/from cart for both anonymous and authenticated users
- Hold stock for 10-15 minutes; expiration clears the cart and restores stock
- View and manage current cart

#### 3.1.3 Order

- Allow placing orders (authenticated users only)
- Deduct items from inventory on successful order
- Trigger email notification to the user on order placement

#### 3.1.4 Inventory

- Maintain item stock and manage stock history
- Automatically update and restore stock when cart expires

#### 3.1.5 User and Authentication

- Register and authenticate users
- Allow password recovery and account verification
- Assign roles and permissions

#### 3.1.6 Email

- Send transactional emails (e.g., order confirmation)
- Store email sending history

#### 3.1.7 API Gateway

- Route API requests to appropriate microservices
- Secure routes and facilitate service discovery

### 3.2 Non-functional Requirements

- High availability and scalability
- Secure handling of user credentials and data
- Robust logging and monitoring
- Extensible database schema

## 4. Architecture and Design

### 4.1 Microservice Breakdown

| Service     | Responsibilities                                                          |
| ----------- | ------------------------------------------------------------------------- |
| Auth        | User registration, authentication, verification, password recovery, roles |
| User        | User profile management                                                   |
| Catalog     | Product creation, update, deletion, and viewing                           |
| Inventory   | Stock management and history                                              |
| Cart        | Cart creation, management, automatic expiration and stock restoration     |
| Order       | Order processing, invoking inventory, cart, user, and email services      |
| Email       | Send and track outgoing emails                                            |
| API Gateway | API management and routing                                                |

### 4.2 Tools and Technologies

- Node.js
- PostgreSQL
- Redis
- Kong API Gateway
- RabbitMQ
- Keycloak

### 4.3 Diagrams

#### 4.3.1 High-level Architecture

![High_Level_Daigram.png]

#### 4.3.2 Database Designs and ERDs

![ecommerce_microservice.png]
![ecommerce_microservice_2.png]
![er_problems.png]
![new_er_1.png]
![new_er_2.png]
![new_er_3.png]
![new_er_4.png]
![new_er_5.png]
![new_er_6.png]
![catalog_inventory.png]
![Order_Processing.png]
![auth_user.png]

## 5. Appendix

### 5.1 Notes

- Anyone can view products and add to cart
- Orders are restricted to logged-in users only

### 5.2 Approaches Considered

- Pro (Best Practices, Full Microservices)
- Amateur (Simplified, Monolithic or less strict microservices)
