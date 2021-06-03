import React from 'react';
import renderer from 'react-test-renderer';
import Button from "../components/Button";

const flatten = (x: renderer.ReactTestRendererJSON | renderer.ReactTestRendererJSON[]): renderer.ReactTestRendererJSON[] => Array.isArray(x) ? x : [x];

describe('<Button />', () => {
  it('has 1 child', () => {
    const tree = renderer.create(<Button>test</Button>).toJSON();
    expect(flatten(tree!)[0].children?.length).toBe(1);
  });

  it('content is test', () => {
    const tree = renderer.create(<Button>test</Button>).toJSON();
    const child = flatten(tree!)[0].children![0];
    expect(typeof child === "string"
      ? child
      : child.children![0]
    ).toBe("test");
  });
});