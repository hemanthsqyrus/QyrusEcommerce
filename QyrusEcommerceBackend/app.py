from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import datetime

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import uvicorn
import traceback
from product_db import products_db, product_categories
from collections import defaultdict
app = FastAPI()

# Add CORS middleware
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock database for demonstration purposes
users_db = {"admin@qyrus.com": {"password": "Qyrus@321"}}
verification_tokens = {}
password_reset_tokens = {}
account_details_db = {}
addresses_db = {}
cart_db = {}
favorites_db = {}
orders_db = {}
account_details_db["admin@qyrus.com"] = {
    "name": "Admin User",
    "age": 30,
    "country": "India",
    "phone": "1234567890"
}

class CreateOrderRequest(BaseModel):
    email: EmailStr
    addressId: str
    products: list
    paymentMethod: str

class CancelOrderRequest(BaseModel):
    email: EmailStr
    orderId: str

class AddFavoriteInput(BaseModel):
    email: EmailStr
    product_id: int

class AddToCartRequest(BaseModel):
    email: EmailStr
    product_id: int
    color: str
    provider: str
    size: str
    quantity: int

class CreateAddressRequest(BaseModel):
    email: EmailStr
    address: str

class DeleteAddressRequest(BaseModel):
    email: EmailStr
    addressId: str

class UpdateAddressRequest(BaseModel):
    email: EmailStr
    addressId: str
    newAddress: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RecordContactRequest(BaseModel):
    email: EmailStr
    comments: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    otp: str
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    password: str
    otp: str
    token: str

class UpdateAccountDetailsRequest(BaseModel):
    email: EmailStr
    name: str
    phone: str
    age: int
    country: str

@app.post("/auth/login/")
def login(request: LoginRequest):
    user = users_db.get(request.email)
    if user and user['password'] == request.password:
        return {"message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/auth/signup/")
def signup(request: SignupRequest):
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")
    users_db[request.email] = {
        "password": request.password,
        "verified": False
    }


    # Initialize empty account details
    account_details_db[request.email] = {
        "name": "",
        "age": "",
        "country": "",
        "phone": ""
    }

    # Generate verification token (mocked)
    token = str(uuid.uuid4())
    verification_tokens[token] = {
        "email": request.email,
        "otp": "123456"
    }
    return {"message": "Signup successful. Please verify your email.", "token": token}

@app.post("/auth/verify-email/")
def verify_email(request: VerifyEmailRequest):
    token_data = verification_tokens.get(request.token)
    if token_data and token_data["otp"] == request.otp:
        user_email = token_data["email"]
        users_db[user_email]["verified"] = True
        del verification_tokens[request.token]
        return {"message": "Email verified successfully"}
    raise HTTPException(status_code=400, detail="Invalid OTP or token")

@app.post("/auth/forgot-password/")
def forgot_password(request: ForgotPasswordRequest):
    if request.email in users_db:
        # Generate password reset token (mocked)
        token = str(uuid.uuid4())
        password_reset_tokens[token] = {
            "email": request.email,
            "otp": "reset123"
        }
        return {"message": "Password reset link sent to your email", "token": token}
    raise HTTPException(status_code=404, detail="Email not registered")

@app.post("/auth/reset-password/")
def reset_password(request: ResetPasswordRequest):
    token_data = password_reset_tokens.get(request.token)
    if token_data and token_data["otp"] == request.otp:
        user_email = token_data["email"]
        users_db[user_email]["password"] = request.password
        del password_reset_tokens[request.token]
        return {"message": "Password reset successfully"}
    raise HTTPException(status_code=400, detail="Invalid OTP or token")

@app.get("/get-products/")
def get_products(category: str = Query(...), subcategory: Optional[str] = Query(None), page: int = Query(...)):
    if subcategory in [None, "none"]:
        filtered_products = [p for p in products_db if p["category"] == category]
    else:
        filtered_products = [p for p in products_db if p["category"] == category and p["subcategory"] == subcategory]

    page_size = 15
    start = (page - 1) * page_size
    end = start + page_size
    total_pages = (len(filtered_products) + page_size - 1) // page_size
    return {
        "products": filtered_products[start:end],
        "total_pages": total_pages
    }

@app.get("/search-products/")
def search_products(
    query: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    sort_by: str = Query("name"),
    sort_order: str = Query("asc"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    category: Optional[str] = Query(None),
    subcategory: Optional[str] = Query(None),
):
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(status_code=400, detail="min_price cannot be greater than max_price")

    normalized_sort_by = sort_by.lower()
    allowed_sort_fields = {"id", "name", "price", "category", "subcategory", "rating"}
    if normalized_sort_by not in allowed_sort_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort_by. Allowed values: {', '.join(sorted(allowed_sort_fields))}",
        )

    normalized_sort_order = sort_order.lower()
    if normalized_sort_order not in {"asc", "desc"}:
        raise HTTPException(status_code=400, detail="sort_order must be either 'asc' or 'desc'")

    filtered_products = [p for p in products_db if query.lower() in p["name"].lower()]

    if category and category.lower() not in {"none", "all"}:
        filtered_products = [
            p for p in filtered_products if p["category"].lower() == category.lower()
        ]

    if subcategory and subcategory.lower() not in {"none", "all"}:
        filtered_products = [
            p for p in filtered_products if p["subcategory"].lower() == subcategory.lower()
        ]

    if min_price is not None:
        filtered_products = [p for p in filtered_products if p["price"] >= min_price]

    if max_price is not None:
        filtered_products = [p for p in filtered_products if p["price"] <= max_price]

    reverse_order = normalized_sort_order == "desc"
    if normalized_sort_by in {"name", "category", "subcategory"}:
        filtered_products = sorted(
            filtered_products,
            key=lambda p: str(p.get(normalized_sort_by, "")).lower(),
            reverse=reverse_order,
        )
    else:
        filtered_products = sorted(
            filtered_products,
            key=lambda p: p.get(normalized_sort_by) if p.get(normalized_sort_by) is not None else 0,
            reverse=reverse_order,
        )

    total_items = len(filtered_products)
    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0
    start = (page - 1) * page_size
    end = start + page_size

    return {
        "products": filtered_products[start:end],
        "total_items": total_items,
        "total_pages": total_pages,
        "page": page,
        "page_size": page_size,
    }

@app.get("/get-product-categories/")
def get_product_categories():
    return {
        "categories": product_categories
    }

@app.get("/get-product-details/{product_id}")
def get_product_details(product_id: int):

    product = next((p for p in products_db if p["id"] == product_id), None)
    if product:
        return {
            "id": product["id"],
            "name": product["name"],
            "price": product["price"],
            "image": product["image"],
            "category": product["category"],
            "subcategory": product["subcategory"],
            "sizes": product.get("sizes"),
            "colors": product.get("colors"),
            "providers": product.get("providers"),
            "description": product.get("description"),
            "rating": product.get("rating"),
            "comments": product.get("comments")
        }
    raise HTTPException(status_code=404, detail="Product not found")

@app.get("/get-account-details/")
def get_account_details(email: EmailStr):
    account_details = account_details_db.get(email)
    if account_details is not None:
        return {
            "email": email,
            **account_details
        }
    raise HTTPException(status_code=404, detail="Account details not found")

@app.post("/update-account-details/")
def update_account_details(request: UpdateAccountDetailsRequest):
    # Check if the user exists
    account_details = account_details_db.get(request.email)
    if account_details is not None:
        # Update account details
        account_details_db[request.email] = {
            "name": request.name,
            "phone": request.phone,
            "age": request.age,
            "country": request.country
        }
        return {
            "message": "Account details updated successfully",
            "updated_details": account_details_db[request.email]
        }
    raise HTTPException(status_code=404, detail="Account not found")


@app.post("/add-to-cart/")
def add_to_cart(request: AddToCartRequest):
    # Check if the user exists
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if product exists
    product = next((p for p in products_db if p["id"] == request.product_id), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Initialize user's cart if not already present
    if request.email not in cart_db:
        cart_db[request.email] = []
    
    # Add item to the user's cart
    cart_item = {
        "cart_item_id": str(uuid.uuid4()),
        "product_id": request.product_id,
        "color": request.color,
        "provider": request.provider,
        "size": request.size,
        "quantity": request.quantity
    }
    cart_db[request.email].append(cart_item)
    
    return {
        "message": "Item added to cart successfully",
        "cart": cart_db[request.email]
    }

@app.post("/record-contact/")
def record_contact(request: RecordContactRequest):
    # Print the comments to the console
    print(f"Contact recorded from {request.email}: {request.comments}")
    
    # Return a success message
    return {
        "message": "Contact recorded successfully",
        "email": request.email
    }


@app.get("/get-cart/")
def get_cart(email: EmailStr):
    # Check if the user exists
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the user's cart
    user_cart = cart_db.get(email, [])
    
    # Fetch detailed product info for each cart item
    detailed_cart = []
    for item in user_cart:
        product = next((p for p in products_db if p["id"] == item["product_id"]), None)
        if product:
            detailed_cart.append({
                "cart_item_id": item["cart_item_id"],
                "product_id": product["id"],
                "name": product["name"],
                "price": product["price"],
                "image": product["image"],  # Include the image field
                "color": item["color"],
                "provider": item["provider"],
                "size": item["size"],
                "quantity": item["quantity"]
            })
    
    return {
        "email": email,
        "cart": detailed_cart
    }


@app.delete("/remove-from-cart/")
async def remove_from_cart(request: Request):
    body = await request.json()
    email = body.get("email")
    cart_item_id = body.get("cart_item_id")

    # Validate email
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate cart exists
    user_cart = cart_db.get(email, [])
    if not user_cart:
        raise HTTPException(status_code=404, detail="Cart is empty")

    # Remove the item with the given cart_item_id
    updated_cart = [item for item in user_cart if item["cart_item_id"] != cart_item_id]

    # Check if an item was removed
    if len(updated_cart) == len(user_cart):
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Update the cart
    cart_db[email] = updated_cart

    return {
        "message": "Item removed from cart successfully",
        "cart": cart_db[email]
    }


@app.post("/add-favorite/")
def add_favorite(request: AddFavoriteInput):
    # Check if the user exists
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if the product exists
    product = next((p for p in products_db if p["id"] == int(request.product_id)), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Initialize the user's favorites if not already present
    if request.email not in favorites_db:
        favorites_db[request.email] = set()
    
    # Add the product to the user's favorites
    favorites_db[request.email].add(request.product_id)
    
    return {
        "message": "Product added to favorites successfully",
        "favorites": list(favorites_db[request.email])
    }

@app.get("/get-favorites/")
def get_favorites(email: EmailStr):
    # Check if the user exists
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get the user's favorites
    user_favorites = favorites_db.get(email, set())
    
    return {
        "email": email,
        "favorites": list(user_favorites)
    }

@app.delete("/remove-favorite/")
def remove_favorite(request: AddFavoriteInput):
    # Check if the user exists
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the user has favorites, otherwise raise a 404
    if request.email not in favorites_db:
        raise HTTPException(status_code=404, detail="No favorites found for this user")

    # Check if the product exists in the user's favorites
    if request.product_id not in favorites_db[request.email]:
        raise HTTPException(status_code=404, detail="Product not found in favorites")

    # Remove the product from the user's favorites
    favorites_db[request.email].remove(request.product_id)

    return {
        "message": "Product removed from favorites successfully",
        "favorites": list(favorites_db[request.email])
    }


@app.post("/create-address/")
def create_address(request: CreateAddressRequest):
    # Validate user
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate a unique address ID
    address_id = str(uuid.uuid4())
    
    # Add the address to the user's address list
    if request.email not in addresses_db:
        addresses_db[request.email] = []
    
    addresses_db[request.email].append({
        "address_id": address_id,
        "address": request.address
    })
    
    return {
        "message": "Address added successfully",
        "address_id": address_id,
        "addresses": addresses_db[request.email]
    }

@app.get("/get-addresses/")
def get_addresses(email: EmailStr):
    # Validate user
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get addresses
    user_addresses = addresses_db.get(email, [])
    
    return {
        "email": email,
        "addresses": user_addresses
    }

@app.delete("/delete-address/")
async def delete_address(request: Request):
    body = await request.json()
    email = body.get("email")
    address_id = body.get("addressId")
    
    # Validate user
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's addresses
    user_addresses = addresses_db.get(email, [])
    
    # Find and delete the address
    updated_addresses = [addr for addr in user_addresses if addr["address_id"] != address_id]
    
    if len(updated_addresses) == len(user_addresses):
        raise HTTPException(status_code=404, detail="Address not found")
    
    addresses_db[email] = updated_addresses
    
    return {
        "message": "Address deleted successfully",
        "addresses": addresses_db[email]
    }

@app.put("/update-address/")
def update_address(request: UpdateAddressRequest):
    # Validate user
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's addresses
    user_addresses = addresses_db.get(request.email, [])
    
    # Find and update the address
    for addr in user_addresses:
        if addr["address_id"] == request.addressId:
            addr["address"] = request.newAddress
            return {
                "message": "Address updated successfully",
                "addresses": user_addresses
            }
    
    raise HTTPException(status_code=404, detail="Address not found")


@app.post("/create-order/")
def create_order(request: CreateOrderRequest):
    # Validate user
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate address
    user_addresses = addresses_db.get(request.email, [])
    if not any(addr["address_id"] == request.addressId for addr in user_addresses):
        raise HTTPException(status_code=404, detail="Address not found")

    # Validate products
    for product in request.products:
        if not any(p["id"] == int(product["productId"]) for p in products_db):
            raise HTTPException(status_code=404, detail=f"Product with ID {product['productId']} not found")

    # Generate a unique order ID
    order_id = str(uuid.uuid4())

    # Create the order
    if request.email not in orders_db:
        orders_db[request.email] = []

    orders_db[request.email].append({
        "order_id": order_id,
        "address_id": request.addressId,
        "products": request.products,
        "payment_method": request.paymentMethod,
        "status": "confirmed",
        "created_at": datetime.utcnow().isoformat()
    })

    return {
        "message": "Order created successfully",
        "order_id": order_id,
        "order_status": "confirmed"
    }

@app.get("/get-orders/")
def get_orders(email: EmailStr):
    # Validate user
    if email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    # Get orders for the user
    user_orders = orders_db.get(email, [])

    return {
        "email": email,
        "orders": user_orders
    }

@app.post("/cancel-order/")
def cancel_order(request: CancelOrderRequest):
    # Validate user
    if request.email not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate order
    user_orders = orders_db.get(request.email, [])
    for order in user_orders:
        if order["order_id"] == request.orderId:
            if order["status"] == "cancelled":
                raise HTTPException(status_code=400, detail="Order already cancelled")
            order["status"] = "cancelled"
            return {
                "message": "Order cancelled successfully",
                "order_id": request.orderId,
                "order_status": "cancelled"
            }

    raise HTTPException(status_code=404, detail="Order not found")


if __name__ == "__main__":
    uvicorn.run('app:app', port=9892, reload=True)    
