import React from 'react';

const DateBreaker = ({ date }) => {
  return (
    <div className="date-breaker">
      <div className="date-breaker-line"></div>
      <span className="date-breaker-text">{date}</span>
      <div className="date-breaker-line"></div>
    </div>
  );
};

export default DateBreaker;

