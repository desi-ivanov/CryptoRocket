import React from 'react';
import Header from "../components/Header";
import { render } from '@testing-library/react-native';

describe('<Header />', () => {
  it('has title', async (finish) => {
    const rr = render(<Header title="Ciao" />);
    const p = await rr.findAllByText("Ciao");
    expect(p.some(x => typeof x === "string" && x === "Ciao"));
    finish();
  });
});