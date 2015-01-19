$(function () {
    $('.del').click(function () {
        if(confirm(('delete sure ?'))) {
            var $this = $(this);
            var id = $this.data('id');
            $.ajax({
                type: 'DELETE',
                url: '/admin/list',
                data: {id: id}
            }).done(function (results) {
                if(results.success == 1) {
                    $this.parents('tr').remove();
                }
            })
        };
    });
});