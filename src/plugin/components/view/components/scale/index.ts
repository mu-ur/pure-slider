import * as A from 'fp-ts/Array';
import * as NEA from 'fp-ts/NonEmptyArray';
import {flow, pipe} from 'fp-ts/function';

import * as H from '../../../../../helpers';

import Element from '../element';
import Unit from '../unit';

import Namespace from './namespace';

class Scale extends Element<Namespace.Props, Namespace.Node> implements Namespace.Interface {
  static of: Namespace.Of = (props) => new Scale(props);

  public readonly moveTo: Namespace.MoveTo = (currents) => {
    const {connectType} = this.props;

    const isEqualTo = (value: number) => (bool: boolean, x: number) => x === value ? true : bool;

    const first = pipe(currents, NEA.head);

    const second = pipe(currents, NEA.last);

    const currentsHasEqualTo = (value: number) => pipe(currents, A.reduce(false, isEqualTo(value)));

    const isLessThanFirst = (value: number): boolean => value <= first;

    const isMoreThanSecond = (value: number): boolean => value >= second;

    const isOuterRange = (value: number): boolean => isLessThanFirst(value) || isMoreThanSecond(value);

    const isInnerRange = (value: number): boolean => value >= first && value <= second;

    const setUnitActive = ({getValue, setActive}: Namespace.Unit) => flow(
      getValue,
      connectType === 'outer-range'
        ? isOuterRange
        : connectType === 'inner-range'
        ? isInnerRange
        : connectType === 'from-start'
          ? isLessThanFirst
          : connectType === 'to-end'
            ? isMoreThanSecond
            : currentsHasEqualTo,
      setActive
    )();

    A.map(setUnitActive)(this.units);
  };

  private constructor(props: Namespace.Props) {
    super(props, H.node('div'), 'scale');

    this.units = this.renderUnits();

    this.setClassList();

    this.appendUnits();
  }

  private readonly units: Namespace.Unit[];

  private readonly getUnitsCount = (stepMult: number) => {
    const {step, range} = this.props;

    return (pipe(range, H.subAdjacent(1), H.div(H.mult(step)(stepMult)), Math.ceil));
  };

  private readonly correctUnitsCount = (stepMult: number) => (unitsCount: number): number => {
    const correctedUnitCount = this.getUnitsCount(stepMult);

    return (correctedUnitCount > 20 ? pipe(stepMult, H.inc, this.correctUnitsCount)(correctedUnitCount) : unitsCount);
  };

  private readonly renderUnits: Namespace.RenderSteps = () => {
    const {step, range, container, orientation, bemBlockClassName, withValue, showValueEach, onClick} = this.props;

    const ofUnit = pipe(Unit, H.prop('of'));

    const originalUnitCount = this.getUnitsCount(1);

    const correctedUnitCount = this.correctUnitsCount(1)(originalUnitCount);

    const min = pipe(range, NEA.head);

    const max = pipe(range, NEA.last);

    const valueFrom = (idx: number): number => pipe(idx, H.mult(step), H.add(min));

    const units: Namespace.Unit[] = [];

    const unitMult = pipe(originalUnitCount, H.div(correctedUnitCount), Math.ceil);

    const arrayToFill: null[] = new Array(H.inc(correctedUnitCount)).fill(null);

    const getUnitProps = (idx: number): Namespace.UnitProps => ({
      range,
      container,
      orientation,
      bemBlockClassName,
      onClick,
      withValue: withValue && ((pipe(
        idx,
        H.div(showValueEach),
        H.decimal(1)
      ) === 0 && pipe(
        idx,
        H.add(showValueEach),
        H.mult(unitMult),
        valueFrom
      ) < max) || pipe(
        idx,
        H.mult(unitMult),
        valueFrom
      ) >= max),
      value: pipe(idx, H.mult(unitMult), valueFrom, (x) => x >= max ? max : x)
    });

    const pushUnit = (idx: number) => units.push(pipe(
      idx,
      getUnitProps,
      ofUnit
    ));

    A.mapWithIndex(pushUnit)(arrayToFill);

    return (units);
  };

  private readonly appendUnits: Namespace.AppendUnits = () => {
    A.map((unit: Namespace.Unit) => pipe(unit.getNode(), H.appendTo(this.node)))(this.units);
  };
}

export default Scale;