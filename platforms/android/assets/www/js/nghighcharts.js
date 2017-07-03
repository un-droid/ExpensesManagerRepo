/**
 * highcharts-ng
 * @version v0.0.6 - 2014-03-29
 * @link https://github.com/pablojim/highcharts-ng
 * @author Barry Fitzgerald <>
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
"use strict";
angular.module("highcharts-ng", []).directive("highchart", function () {
  function a(a, b, c) {
    var d = a[b];
    a[b] = function () {
      var a = Array.prototype.slice.call(arguments);
      return c.apply(this, a), d ? d.apply(this, a) : void 0
    }
  }

  function b(a, c) {
    for (var d in c) c[d] && c[d].constructor && c[d].constructor === Object ? (a[d] = a[d] || {}, b(a[d], c[d])) : a[d] = c[d];
    return a
  }
  var c = function (a, b, c) {
      void 0 === c && (c = 0), 0 > c && (c += a.length), 0 > c && (c = 0);
      for (var d = a.length; d > c; c++)
        if (c in a && a[c] === b) return c;
      return -1
    },
    d = 0,
    e = function (a) {
      var b = !1;
      return angular.forEach(a, function (a) {
        angular.isDefined(a.id) || (a.id = "series-" + d++, b = !0)
      }), b
    },
    f = ["xAxis", "yAxis"],
    g = function (c, d, e) {
      var g = {},
        h = {
          chart: {
            events: {}
          },
          title: {},
          subtitle: {},
          series: [],
          credits: {},
          plotOptions: {},
          navigator: {
            enabled: !1
          }
        };
      return g = e.options ? b(h, e.options) : h, g.chart.renderTo = d[0], angular.forEach(f, function (b) {
        angular.isDefined(e[b]) && (g[b] = angular.copy(e[b]), (angular.isDefined(e[b].currentMin) || angular.isDefined(e[b].currentMax)) && (a(g.chart.events, "selection", function (a) {
          var d = this;
          a[b] ? c.$apply(function () {
            c.config[b].currentMin = a[b][0].min, c.config[b].currentMax = a[b][0].max
          }) : c.$apply(function () {
            c.config[b].currentMin = d[b][0].dataMin, c.config[b].currentMax = d[b][0].dataMax
          })
        }), a(g.chart.events, "addSeries", function () {
          c.config[b].currentMin = this[b][0].min || c.config[b].currentMin, c.config[b].currentMax = this[b][0].max || c.config[b].currentMax
        })))
      }), e.title && (g.title = e.title), e.subtitle && (g.subtitle = e.subtitle), e.credits && (g.credits = e.credits), e.size && (e.size.width && (g.chart.width = e.size.width), e.size.height && (g.chart.height = e.size.height)), g
    },
    h = function (a, b) {
      var c = a.getExtremes();
      (b.currentMin !== c.dataMin || b.currentMax !== c.dataMax) && a.setExtremes(b.currentMin, b.currentMax, !1)
    },
    i = function (a, b, c) {
      (b.currentMin || b.currentMax) && a[c][0].setExtremes(b.currentMin, b.currentMax, !0)
    },
    j = function (a) {
      return angular.extend({}, a, {
        data: null,
        visible: null
      })
    };
  return {
    restrict: "EAC",
    replace: !0,
    template: "<div></div>",
    scope: {
      config: "="
    },
    link: function (a, b) {
      var d = {},
        k = function (b) {
          var f, g = [];
          if (b) {
            var h = e(b);
            if (h) return !1;
            if (angular.forEach(b, function (a) {
                g.push(a.id);
                var b = l.get(a.id);
                b ? angular.equals(d[a.id], j(a)) ? (void 0 !== a.visible && b.visible !== a.visible && b.setVisible(a.visible, !1), b.setData(angular.copy(a.data), !1)) : b.update(angular.copy(a), !1) : l.addSeries(angular.copy(a), !1), d[a.id] = j(a)
              }), a.config.noData) {
              var i = !1;
              for (f = 0; f < b.length; f++)
                if (b[f].data && b[f].data.length > 0) {
                  i = !0;
                  break
                }
              i ? l.hideLoading() : l.showLoading(a.config.noData)
            }
          }
          for (f = l.series.length - 1; f >= 0; f--) {
            var k = l.series[f];
            c(g, k.options.id) < 0 && k.remove(!1)
          }
          return !0
        },
        l = !1,
        m = function () {
          l && l.destroy(), d = {};
          var c = a.config || {},
            e = g(a, b, c);
          l = c.useHighStocks ? new Highcharts.StockChart(e) : new Highcharts.Chart(e);
          for (var h = 0; h < f.length; h++) c[f[h]] && i(l, c[f[h]], f[h]);
          c.loading && l.showLoading()
        };
      m(), a.$watch("config.series", function (a) {
        var b = k(a);
        b && l.redraw()
      }, !0), a.$watch("config.title", function (a) {
        l.setTitle(a, !0)
      }, !0), a.$watch("config.subtitle", function (a) {
        l.setTitle(!0, a)
      }, !0), a.$watch("config.loading", function (a) {
        a ? l.showLoading() : l.hideLoading()
      }), a.$watch("config.credits.enabled", function (a) {
        a ? l.credits.show() : l.credits && l.credits.hide()
      }), a.$watch("config.useHighStocks", function (a, b) {
        a !== b && m()
      }), angular.forEach(f, function (b) {
        a.$watch("config." + b, function (a, c) {
          a !== c && a && (l[b][0].update(a, !1), h(l[b][0], angular.copy(a)), l.redraw())
        }, !0)
      }), a.$watch("config.options", function (a, b, c) {
        a !== b && (m(), k(c.config.series), l.redraw())
      }, !0), a.$watch("config.size", function (a, b) {
        a !== b && a && l.setSize(a.width || void 0, a.height || void 0)
      }, !0), a.$on("highchartsng.reflow", function () {
        l.reflow()
      }), a.$on("$destroy", function () {
        l && l.destroy(), b.remove()
      })
    }
  }
});
