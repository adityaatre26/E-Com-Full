import React from "react";
import { Link } from "react-router-dom";
import "../styles/ProductCard.css";

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      {/* Product Image */}
      <div className="product-image-container">
        <img src={product.thumbnail} alt={product.title} className="product-image" />
      </div>

      {/* Product Details */}
      <div className="product-details">
        <div className="product-header">
          <h5 className="product-title">{product.title}</h5>
          <h6 className="product-price">${product.price}</h6>
        </div>
        <p className="product-description">{product.description}</p>

        {/* Actions */}
        <div className="product-actions">
          {/* Wishlist Icon */}
          <div className="wishlist-button" title="Wishlist">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              width="16px"
              className="wishlist-icon"
            >
              <path
                d="M45.5 4A18.53 18.53 0 0 0 32 9.86 18.5 18.5 0 0 0 0 22.5C0 40.92 29.71 59 31 59.71a2 2 0 0 0 2.06 0C34.29 59 64 40.92 64 22.5A18.52 18.52 0 0 0 45.5 4ZM32 55.64C26.83 52.34 4 36.92 4 22.5a14.5 14.5 0 0 1 26.36-8.33 2 2 0 0 0 3.27 0A14.5 14.5 0 0 1 60 22.5c0 14.41-22.83 29.83-28 33.14Z"
                fill="#ff3b5f"
              />
            </svg>
          </div>

          {/* Add to Cart Button */}
          <button className="add-to-cart-button">Add to cart</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;