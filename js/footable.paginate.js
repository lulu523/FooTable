(function ($, w, undefined) {
    if (w.footable == undefined || w.footable == null)
        throw new Error('Please check and make sure footable.js is included in the page and is loaded prior to this script.');

    var defaults = {
        paginate: true,
        pageSize: 10,
        pageNavigation: '.pagination',
		previousText: '&laquo;',
		nextText: '&raquo;'
    };

    function pageInfo(ft) {
        var $table = $(ft.table), $tbody = $table.find('> tbody');
        this.pageNavigation = $table.data('page-navigation') || ft.options.pageNavigation;
        this.pageSize = $table.data('page-size') || ft.options.pageSize;
		this.previousText = $table.data('page-previous-text') || ft.options.previousText;
		this.nextText = $table.data('page-next-text') || ft.options.nextText;
        this.currentPage = 0;
        this.pages = [];
    };

    function Paginate() {
        var p = this;
        p.name = 'Footable Paginate';

        p.init = function (ft) {
            if (ft.options.paginate == true) {
                $(ft.table).bind({
                    'footable_initialized': function (e) {
                        e.ft.pageInfo = new pageInfo(e.ft);
						e.ft.raise('footable_setup_paging');
                    },
                    'footable_sorted footable_filtered footable_setup_paging': function () {
                        p.setupPaging(ft);
                    }
                });
            }
        };
		
		p.setupPaging = function(ft) {
			var $tbody = $(ft.table).find('> tbody');
			p.createPages(ft, $tbody);
			p.createNavigation(ft, $tbody);
			p.fillPage(ft, $tbody, ft.pageInfo.currentPage);
		};

        p.createPages = function (ft, tbody) {
            var pages = 1;
            var info = ft.pageInfo;
            var pageCount = pages * info.pageSize;
            var page = [];
            var lastPage = [];
            info.pages = [];
            var rows = tbody.find('> tr:not(.footable-filtered,.footable-row-detail)');
            rows.each(function (i, row) {
                page.push(row);
                if (i === pageCount - 1) {
                    info.pages.push(page);
                    pages++;
                    pageCount = pages * info.pageSize;
                    page = [];
                } else if (i >= rows.length - (rows.length % info.pageSize)) {
                    lastPage.push(row);
                }
            });
            if (lastPage.length > 0) info.pages.push(lastPage);
            if (info.currentPage >= info.pages.length) info.currentPage = info.pages.length - 1;
            if (info.currentPage < 0) info.currentPage = 0;
        };

        p.createNavigation = function (ft, tbody) {
            var $nav = $(ft.table).find(ft.pageInfo.pageNavigation);
			//if we cannot find the navigation control within the table, then try find it outside
			if ($nav.length == 0) {
				$nav = $(ft.pageInfo.pageNavigation);
				//if the navigation control is inside another table, then get out
				if ($nav.parents('table:first') != $(ft.table)) return;
				//if we found more than one navigation control, write error to console
				if ($nav.length > 1 && ft.options.debug == true) console.error('More than one pagination control was found!');
			}
			//if we still cannot find the control, then don't do anything
            if ($nav.length == 0) return;
			//if the nav is not a UL, then find or create a UL
			if (!$nav.is('ul')) { 
				if ($nav.find('ul:first').length == 0) { $nav.append('<ul />'); }
				$nav = $nav.find('ul');
			}
            $nav.find('li').remove();
            var info = ft.pageInfo;
            if (info.pages.length > 0) {
                $nav.append('<li class="footable-page-arrow"><a data-page="prev" href="#prev">'+ft.pageInfo.previousText+'</a></li>');
                $.each(info.pages, function (i, page) {
                    if (page.length > 0) {
                        $nav.append('<li class="footable-page"><a data-page="' + i + '" href="#">' + (i + 1) + '</a></li>');
                    }
                });
                $nav.append('<li class="footable-page-arrow"><a data-page="next" href="#next">'+ft.pageInfo.nextText+'</a></li>');
            }
            $nav.find('a').click(function (e) {
                e.preventDefault();
                var page = $(this).data('page');
                var newPage = info.currentPage;
                if (page == 'prev') {
                    if (newPage > 0) newPage--;
                } else if (page == 'next') {
                    if (newPage < info.pages.length - 1) newPage++;
                } else {
                    newPage = page;
                }
                if (info.currentPage != newPage) {
                    p.fillPage(ft, tbody, newPage);
					$nav.find('li').removeClass('active disabled');
					p.setPagingClasses($nav, info.currentPage, info.pages.length);
                }
            });
			p.setPagingClasses($nav, info.currentPage, info.pages.length);
        };
		
		p.setPagingClasses = function(nav, currentPage, pageCount) {
            nav.find('li.footable-page > a[data-page=' + currentPage + ']').parent().addClass('active');
			if (currentPage >= pageCount - 1) {
				nav.find('li.footable-page-arrow > a[data-page="next"]').parent().addClass('disabled');
			}
			if (currentPage < 1) {
				nav.find('li.footable-page-arrow > a[data-page="prev"]').parent().addClass('disabled');
			}
		};

        p.fillPage = function (ft, tbody, pageNumber) {
            ft.pageInfo.currentPage = pageNumber;
            tbody.find('> tr').hide();
            $(ft.pageInfo.pages[pageNumber]).each(function () {
                p.showRow(this, ft);
            });
        };

        p.showRow = function (row, ft) {
            var $row = $(row), $next = $row.next(), $table = $(ft.table);
            if ($table.hasClass('breakpoint') && $row.hasClass('footable-detail-show') && $next.hasClass('footable-row-detail')) {
                $row.add($next).show();
                ft.createOrUpdateDetailRow(row);
            }
            else $row.show();
        };
    };

    w.footable.plugins.register(new Paginate(), defaults);

})(jQuery, window);