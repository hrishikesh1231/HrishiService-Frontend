import React from "react";

const ShopCard = ({ shop, onClick }) => {
  return (
    <article className="shop-card" onClick={onClick} role="listitem" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <div className="shop-image" style={{ backgroundImage: `url(${shop.image})` }} aria-hidden="true" />
      <div className="shop-body">
        <h3 className="shop-name">{shop.name}</h3>
        <p className="shop-meta">
          <span className="shop-category">{shop.category}</span> • <span className="shop-address">{shop.address}</span>
        </p>
        <div className="shop-bottom">
          {/* <span className="delivery">Delivery ₹{shop.deliveryCharge}</span> */}
          <button className="order-btn" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            Order
          </button>
        </div>
      </div>
    </article>
  );
};

export default ShopCard;
