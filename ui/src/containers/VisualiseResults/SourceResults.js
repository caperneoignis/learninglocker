import React from 'react';
import { compose } from 'recompose';
import NoData from 'ui/components/Graphs/NoData';
import { Map, OrderedMap, fromJS } from 'immutable';
import isString from 'lodash/isString';
import _ from 'lodash';
import { withStatementsVisualisation } from 'ui/utils/hocs';
import { getAxesString } from 'ui/utils/defaultTitles';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import styles from './styles.css';
import { displayVerb, displayActivity } from '../../utils/xapi';

const moreThanOneSeries = tData => tData.first() !== undefined && tData.first().size > 1;

const getPaths = (obj, path = [], level = 0) => {
  if (level === 5) {
    return [path];
  }

  return _.flatten(_.map(obj, (ob, key) => {
    const out = getPaths(ob, [...path, key], level + 1);
    return out;
  }));
};

const setDefaults = (obj, defaultArray, level = 0) => {
  if (defaultArray.length === 0 || !_.isObject(obj)) {
    return obj;
  }

  const defaultObj = _.merge({}, ..._.map(defaultArray, (path) => {
    if (path.length === 0) {
      return {};
    }
    return { [path[0]]: 'default' };
  }));

  const subObj = _.reduce(obj, (acc, subOb, key) => {

    return _.set(acc, key, setDefaults(
        subOb,
        _.map(defaultArray, item => _.drop(item)),
        level + 1
    ));
  }, {});

  const out = {
    ...defaultObj,
    ...subObj
  };

  return out;
};

export const generateTableData = (results, labels) => {
  const seriesList = labels.zip(results);
  const seriesList2 = seriesList.map(([key, item], i) => {
    if (key === undefined) {
      return [`Series ${i + 1}`, item];
    }
    return [key, item];
  });
  const seriesMap = new OrderedMap(seriesList2);

  const result = seriesMap.reduce((reduction, series, seriesKey) =>
    series.reduce(
      (axesReduction, axes2, axesKey) => axes2.reduce(
        (seriesReduction, item) => {
          const dataKeyName = [item.get('_id'), 'rowData', seriesKey, axesKey];
          const modelKeyName = [item.get('_id'), 'model'];
          return seriesReduction
            .setIn(dataKeyName, item)
            .setIn(modelKeyName, item.get('model'));
        },
      axesReduction),
    reduction)
  , new OrderedMap());

  const resultJs = result.toJS();

  const paths = getPaths(resultJs);
  const out = setDefaults(resultJs, paths);

  return fromJS(out);
};

const formatKeyToFriendlyString = (key) => {
  if (isString(key)) return key;

  if (Map.isMap(key)) {
    if (key.get('objectType')) {
      return displayActivity(key);
    }
    if (key.get('display')) {
      return displayVerb(key);
    }
    if (key.has('id')) {
      return key.get('id');
    }

    return JSON.stringify(key.toJS(), null, 2);
  }

  return JSON.stringify(key, null, 2);
};

const getAxisLabel = (axis, visualisation, type) => {
  if (type !== 'XVSY') {
    return getAxesString(axis, visualisation, type, false);
  }
  return visualisation.getIn(['axesgroup', 'searchString'], 'No value');
};

const createSelectIfXVSY = (index, visualisation, type, axis) => {
  if (type !== 'XVSY') {
    return getAxisLabel(axis, visualisation, type);
  }
  if (index === 0) {
    return visualisation.get('axesxLabel', visualisation.getIn(['axesxValue', 'searchString'], 'No value'));
  }
  return visualisation.get('axesyLabel', visualisation.getIn(['axesyValue', 'searchString'], 'No value'));
};

const formatNumber = (selectedAxes) => {
  if (selectedAxes.get('count') % 1 !== 0) {
    return selectedAxes.get('count').toFixed(2);
  }
  return selectedAxes.get('count');
};

export default compose(
  withStatementsVisualisation,
  withStyles(styles),
)(({
  getFormattedResults,
  results,
  labels,
  model,
  visualisation
}) => {
  const formattedResults = getFormattedResults(results);
  const tableData = generateTableData(formattedResults, labels);

  if (tableData.first()) {
    return (
      <div className={styles.sourceResultsContainer}>
        <table className="table table-bordered table-striped">
          <tbody>
            {moreThanOneSeries(tableData) && <tr>
              <th />
              {tableData.first().get('rowData', new Map()).map((item, key) => (
                <th key={key} colSpan={item.size}>{key}</th>
              )).valueSeq()}
            </tr>}
            <tr>
              <th>{getAxisLabel('x', visualisation, model.get('type'))}</th>
              {tableData.first().get('rowData', new Map()).map((series, key) => {
                const out = series.mapEntries(
                  ([title], index) =>
                    [
                      index,
                      (<th key={`${key}-${index}`}>{createSelectIfXVSY(index, visualisation, model.get('type'), 'y')}</th>)
                    ]
                  );
                return out.valueSeq();
              }).valueSeq()
              }
            </tr>
            {tableData.map((row, key) => (
              <tr key={key}>
                <td title={key}>{formatKeyToFriendlyString(row.get('model', key))}</td>
                {row.get('rowData', new Map()).map(series =>
                  series.map(axes2 => (
                    <td>{formatNumber(axes2)}</td>)
                  ).valueSeq()
                ).valueSeq()}
              </tr>
            )).valueSeq()}
          </tbody>
        </table>
      </div>
    );
  }
  return (<NoData />);
});
