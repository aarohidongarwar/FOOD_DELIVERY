import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OrderTracking from './src/pages/OrderTracking.jsx';
import { BrowserRouter } from 'react-router-dom';

const testRender = () => {
  try {
    const html = renderToStaticMarkup(
      <BrowserRouter>
        <OrderTracking />
      </BrowserRouter>
    );
    console.log('Render successful!', html.substring(0, 100));
  } catch (err) {
    console.error('Render failed:', err);
  }
};
testRender();
