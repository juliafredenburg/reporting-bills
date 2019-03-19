function add(num1, num2) {
  return num1 + num2;
}

function fibonacci(fib) {
  let numArray = [0, 1];

  for (let num = 1; num < fib - 1; num++) {
    let num2 = num - 1;
    numArray.push(add(numArray[num], numArray[num2]));
  };

  if (Number.isInteger(fib) && fib > 1) {
    return numArray;
  } else if (fib == 1) {
    return [0];
  };

  return undefined;
  //  console.log(numArray);
  //return numArray;
};

console.log(fibonacci(10));
console.log(fibonacci('hats'));
console.log(fibonacci(-1));
console.log(fibonacci(1));
console.log(fibonacci(0));
console.log(fibonacci(2));
console.log(fibonacci({ number1: 1 }));
