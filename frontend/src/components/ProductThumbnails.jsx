import React from "react";

const ProductThumbnails = ({ products }) => {
  return (
    <div style={styles.container}>
      {products.map((product) => (
        <div key={product.id} style={styles.card}>
          <img
            src={product.thumbnail}
            alt={product.title}
            style={styles.thumbnail}
          />
          <h3 style={styles.title}>{product.title}</h3>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    padding: "20px",
  },
  card: {
    textAlign: "center",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "10px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  thumbnail: {
    width: "100%",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
  },
};

export default ProductThumbnails;
